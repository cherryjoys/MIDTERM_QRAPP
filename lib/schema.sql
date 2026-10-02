-- ============================================================
-- Phase 3 — Supabase PostgreSQL Schema for QR-ATT
--
-- This file replaces the local SQLite schema with a cloud schema.
-- It mirrors the original `events` and `attendance` tables but
-- integrates with Supabase Auth (auth.users) and adds Row Level
-- Security so each user can only see their own data.
--
-- It also adds the `event_roster` table plus a `status` column on
-- `attendance`, which together make Present / Late / Absent real:
-- see section 2B for how the three states are derived.
--
-- HOW TO RUN:
--   1. Open Supabase Dashboard -> SQL Editor
--   2. Paste the ENTIRE file
--   3. Click "Run"
--   4. Verify the tables appear under Table Editor
--
-- This script is IDEMPOTENT: it can be run multiple times safely.
--
-- IMPORTANT: All tables are created BEFORE any policy. PostgreSQL
-- validates RLS policy expressions when the policy is created, so a
-- policy referencing a table that does not exist yet fails with
-- "ERROR: 42P01: relation ... does not exist".
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABLES
-- ------------------------------------------------------------

-- PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'student' check (role in ('student', 'teacher')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- EVENTS
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  event_code text not null unique,
  title text not null,
  start_time timestamptz,
  end_time timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  -- A scan counts as LATE once it lands more than this many minutes after
  -- start_time. 0 means "late from the very first second of the event".
  late_after_minutes integer not null default 10
);

-- ATTENDANCE
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  scanned_at timestamptz not null default now(),
  -- Derived by the on_attendance_insert trigger below, never by the client.
  -- 'absent' is intentionally NOT storable: absence is the absence of a row,
  -- computed by joining event_roster against this table.
  status text not null default 'present' check (status in ('present', 'late')),
  unique (student_id, event_id)
);

-- EVENT ROSTER
-- The students a teacher expects to see for an event. Any roster row with no
-- matching attendance row is what the app renders as ABSENT, which is what
-- makes the Present / Late / Absent trio real rather than cosmetic.
create table if not exists public.event_roster (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  -- Resolved from the teacher roster when the name matches a known profile.
  -- Null for names that do not match an account yet; those still count as
  -- expected attendees and can be matched later by name.
  student_id uuid references auth.users (id) on delete cascade,
  student_name text not null,
  created_at timestamptz not null default now(),
  unique (event_id, student_name)
);

-- Enable Row Level Security on all tables
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.attendance enable row level security;
alter table public.event_roster enable row level security;

-- ------------------------------------------------------------
-- 2. AUTOMATIC PROFILE CREATION
-- ------------------------------------------------------------

-- Automatically create a profile after a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- 2B. ATTENDANCE STATE (present / late / absent)
-- ------------------------------------------------------------
-- The three attendance states are derived, never hand-written:
--
--   present  scanned_at <= start_time + late_after_minutes
--   late     scanned_at  > start_time + late_after_minutes
--   absent   a row in event_roster with no matching attendance row
--
-- present/late are resolved by a trigger so the database stays the single
-- source of truth — a client that lies about `status` still gets the right
-- value. absent is never stored, because an absent student has no row at all.
--
-- These ALTERs bring an existing database up to date; they are no-ops on a
-- fresh install because the columns above are already part of CREATE TABLE.

alter table public.events
  add column if not exists late_after_minutes integer not null default 10;

alter table public.attendance
  add column if not exists status text not null default 'present';

alter table public.attendance
  drop constraint if exists attendance_status_check;
alter table public.attendance
  add constraint attendance_status_check check (status in ('present', 'late'));

create or replace function public.resolve_attendance_status()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  event_start timestamptz;
  grace_minutes integer;
begin
  select e.start_time, coalesce(e.late_after_minutes, 10)
    into event_start, grace_minutes
    from public.events e
   where e.id = new.event_id;

  -- No start time to compare against, so the scan is simply on time.
  if event_start is null
     or new.scanned_at <= event_start + make_interval(mins => grace_minutes) then
    new.status := 'present';
  else
    new.status := 'late';
  end if;

  return new;
end;
$$;

drop trigger if exists on_attendance_insert on public.attendance;
create trigger on_attendance_insert
  before insert on public.attendance
  for each row execute procedure public.resolve_attendance_status();

-- Backfill rows that predate the trigger. Re-running is safe: it recomputes
-- the same value every time.
update public.attendance a
   set status = case
     when e.start_time is null
       or a.scanned_at <= e.start_time + make_interval(mins => coalesce(e.late_after_minutes, 10))
       then 'present'
     else 'late'
   end
  from public.events e
 where e.id = a.event_id;

-- ------------------------------------------------------------
-- 3. POLICIES
-- ------------------------------------------------------------

-- Profiles policies
drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Events policies
-- Any signed-in user can read event details (needed to validate QR codes)
drop policy if exists "Events are readable by any authenticated user" on public.events;
create policy "Events are readable by any authenticated user"
  on public.events for select
  using (auth.role() = 'authenticated');

-- Only the creator can insert / update their events
drop policy if exists "Users can insert events" on public.events;
create policy "Users can insert events"
  on public.events for insert
  with check (auth.role() = 'authenticated');

-- Only the creator can insert / update their events.
-- A teacher may ALSO adopt an unclaimed (orphan) event row — one that was
-- auto-created during a scan before the teacher saved the event — so the
-- upsert (onConflict: event_code) can set created_by on that same row.
drop policy if exists "Users can update their own events" on public.events;
create policy "Users can update their own events"
  on public.events for update
  using (auth.uid() = created_by or created_by is null)
  with check (auth.uid() = created_by or created_by is null);

-- Attendance policies
-- Students can only view / insert their own attendance
drop policy if exists "Students can view their own attendance" on public.attendance;
create policy "Students can view their own attendance"
  on public.attendance for select
  using (auth.uid() = student_id);

drop policy if exists "Students can insert their own attendance" on public.attendance;
create policy "Students can insert their own attendance"
  on public.attendance for insert
  with check (auth.uid() = student_id);

-- Teachers can view attendance for events they created, plus any event
-- row that shares the same event_code (covers QRs whose events were
-- auto-created during a scan before the teacher saved the event).
drop policy if exists "Teachers can view attendance for their events" on public.attendance;
create policy "Teachers can view attendance for their events"
  on public.attendance for select
  using (
    exists (
      select 1 from public.events e
      where e.id = attendance.event_id
        and exists (
          select 1 from public.events own
          where own.event_code = e.event_code
            and own.created_by = auth.uid()
        )
    )
  );

-- Teachers can read the profiles of students who attended their events
-- (needed to show attendee names in the teacher's History view).
-- Mirrors the attendance policy: matches any event row sharing the teacher's
-- event_code, so students of auto-created (orphan) event rows also show.
drop policy if exists "Teachers can view profiles of their attendees" on public.profiles;
create policy "Teachers can view profiles of their attendees"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.attendance a
      join public.events e on e.id = a.event_id
      where a.student_id = profiles.id
        and exists (
          select 1 from public.events own
          where own.event_code = e.event_code
            and own.created_by = auth.uid()
        )
    )
    or exists (
      -- A student on a roster the teacher built for one of their own events,
      -- so their name can be resolved to an id when the roster is saved.
      select 1
      from public.event_roster r
      join public.events e on e.id = r.event_id
      where r.student_id = profiles.id
        and exists (
          select 1 from public.events own
          where own.event_code = e.event_code
            and own.created_by = auth.uid()
        )
    )
  );

-- Event roster policies
-- Only the teacher who owns the event may write its roster. Lookups go through
-- event_code so orphan event rows auto-created by an early scan are covered.
drop policy if exists "Teachers can view the roster for their events" on public.event_roster;
create policy "Teachers can view the roster for their events"
  on public.event_roster for select
  using (
    exists (
      select 1 from public.events e
      where e.id = event_roster.event_id
        and exists (
          select 1 from public.events own
          where own.event_code = e.event_code
            and own.created_by = auth.uid()
        )
    )
  );

drop policy if exists "Students can view their own roster entry" on public.event_roster;
create policy "Students can view their own roster entry"
  on public.event_roster for select
  using (auth.uid() = student_id);

drop policy if exists "Teachers can insert roster entries for their events" on public.event_roster;
create policy "Teachers can insert roster entries for their events"
  on public.event_roster for insert
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_roster.event_id
        and exists (
          select 1 from public.events own
          where own.event_code = e.event_code
            and own.created_by = auth.uid()
        )
    )
  );

drop policy if exists "Teachers can update roster entries for their events" on public.event_roster;
create policy "Teachers can update roster entries for their events"
  on public.event_roster for update
  using (
    exists (
      select 1 from public.events e
      where e.id = event_roster.event_id
        and exists (
          select 1 from public.events own
          where own.event_code = e.event_code
            and own.created_by = auth.uid()
        )
    )
  )
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_roster.event_id
        and exists (
          select 1 from public.events own
          where own.event_code = e.event_code
            and own.created_by = auth.uid()
        )
    )
  );

drop policy if exists "Teachers can delete roster entries for their events" on public.event_roster;
create policy "Teachers can delete roster entries for their events"
  on public.event_roster for delete
  using (
    exists (
      select 1 from public.events e
      where e.id = event_roster.event_id
        and exists (
          select 1 from public.events own
          where own.event_code = e.event_code
            and own.created_by = auth.uid()
        )
    )
  );

------------------------------------------------------------
-- END OF SCHEMA
------------------------------------------------------------
