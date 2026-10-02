import { supabase } from './supabase';

/** Minutes after start_time before a scan counts as late. */
export const DEFAULT_LATE_AFTER_MINUTES = 10;

const MAX_ROSTER_SIZE = 100;

export type Event = {
  eventId: string; // public event code from the UI (e.g. EVT-2026-0002)
  title: string;
  start: string;
  end: string;
  /** Late window in minutes. Defaults to DEFAULT_LATE_AFTER_MINUTES. */
  lateAfterMinutes?: number;
  /** Expected students. Roster rows without a scan become ABSENT. */
  expectedStudents?: string | string[];
};

export type CloudEvent = {
  id: string;
  event_code: string;
  title: string;
  start_time: string | null;
  end_time: string | null;
  late_after_minutes: number;
  created_by: string | null;
  created_at: string;
};

/** Coerces free input into a clean, de-duplicated, ordered list of names. */
export function normalizeRoster(raw: string | string[] | undefined): string[] {
  const parts = Array.isArray(raw) ? raw : (raw ?? '').split(/[,\n]/);
  const byLowercase = new Map<string, string>();

  for (const part of parts) {
    const name = part.trim().replace(/\s+/g, ' ');
    if (!name) continue;
    const key = name.toLowerCase();
    if (!byLowercase.has(key)) byLowercase.set(key, name);
    if (byLowercase.size >= MAX_ROSTER_SIZE) break;
  }

  return Array.from(byLowercase.values());
}

/** Clamps the late window to a sane 0–240 minute range. */
export function normalizeLateAfterMinutes(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_LATE_AFTER_MINUTES;
  }
  return Math.min(240, Math.max(0, Math.round(value)));
}

export async function createEvent(
  event: Event
): Promise<{ error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('events')
    .upsert(
      {
        event_code: event.eventId,
        title: event.title,
        start_time: event.start || null,
        end_time: event.end || null,
        late_after_minutes: normalizeLateAfterMinutes(event.lateAfterMinutes),
        created_by: user?.id ?? null,
      },
      { onConflict: 'event_code' }
    )
    .select('id');

  if (error) {
    return { error: error.message ?? null };
  }

  const rowId = (data?.[0] as { id?: string } | undefined)?.id;
  const names = normalizeRoster(event.expectedStudents);
  if (!rowId || names.length === 0) {
    return { error: null };
  }

  return { error: await syncEventRoster(rowId, names) };
}

/**
 * Makes `names` the authoritative roster for an event: stale entries are
 * removed, the remaining ones are upserted, and each is linked to a real
 * account when a profile carries exactly that name.
 */
async function syncEventRoster(
  eventId: string,
  names: string[]
): Promise<string | null> {
  const { data: existing, error: readError } = await supabase
    .from('event_roster')
    .select('id, student_name')
    .eq('event_id', eventId);

  if (readError) {
    return readError.message ?? null;
  }

  const keep = new Set(names.map((name) => name.toLowerCase()));
  const staleIds = (existing ?? [])
    .filter((row: any) => !keep.has(String(row.student_name).toLowerCase()))
    .map((row: any) => row.id as string);

  if (staleIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('event_roster')
      .delete()
      .in('id', staleIds);

    if (deleteError) {
      return deleteError.message ?? null;
    }
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('full_name', names);

  const idByName = new Map<string, string>();
  for (const profile of (profiles ?? []) as any[]) {
    if (profile.full_name && profile.id) {
      idByName.set(profile.full_name as string, profile.id as string);
    }
  }

  const { error: upsertError } = await supabase.from('event_roster').upsert(
    names.map((studentName) => ({
      event_id: eventId,
      student_name: studentName,
      student_id: idByName.get(studentName) ?? null,
    })),
    { onConflict: 'event_id,student_name' }
  );

  return upsertError?.message ?? null;
}

export async function getEventsByTeacher(
  teacherId: string
): Promise<CloudEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('created_by', teacherId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as CloudEvent[];
}

export async function getEventByCode(
  code: string
): Promise<CloudEvent | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('event_code', code)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as CloudEvent;
}
