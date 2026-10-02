import Ionicons from '@expo/vector-icons/Ionicons';

import { COLORS } from './colors';

export type IconName = keyof typeof Ionicons.glyphMap;

/**
 * The app's shared icon vocabulary. Every screen picks from this list so the
 * same concept always uses the same glyph — that is what keeps the set reading
 * as one system instead of a pile of one-off icons.
 */
export const APP_ICONS = {
  // Attendance / QR theme
  qr: 'qr-code-outline',
  scan: 'scan-outline',
  camera: 'camera-outline',

  // Attendance detail
  calendar: 'calendar-outline',
  clock: 'time-outline',
  clockFilled: 'time',
  timer: 'timer-outline',
  roster: 'people-outline',

  // Identity & navigation
  user: 'person-outline',
  home: 'home-outline',
  history: 'clipboard-outline',
  mail: 'mail-outline',
  lock: 'lock-closed-outline',

  // Actions
  edit: 'create-outline',
  save: 'checkmark-outline',
  close: 'close-outline',
  retry: 'refresh-outline',
  add: 'add-circle-outline',

  // Accents
  sparkle: 'sparkles-outline',
} as const satisfies Record<string, IconName>;

export type StatusKey = 'present' | 'late' | 'absent';

export type StatusMeta = {
  icon: IconName;
  label: string;
  color: string;
  soft: string;
};

/** Presentation for each attendance state. Absent is derived, never scanned. */
export const STATUS_META: Record<StatusKey, StatusMeta> = {
  present: {
    icon: 'checkmark-circle',
    label: 'Present',
    color: COLORS.present,
    soft: COLORS.presentSoft,
  },
  late: {
    icon: 'time-outline',
    label: 'Late',
    color: COLORS.late,
    soft: COLORS.lateSoft,
  },
  absent: {
    icon: 'close-circle',
    label: 'Absent',
    color: COLORS.absent,
    soft: COLORS.absentSoft,
  },
};

export const STATUS_ORDER: StatusKey[] = ['present', 'late', 'absent'];
