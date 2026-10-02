export const COLORS = {
  // Brand — lavender / violet
  primary: '#5B3FBF',
  primaryDark: '#3E2A85',
  primaryLight: '#EDE7FE',

  accent: '#7C5CD6',
  accentSoft: '#F4F0FE',

  background: '#F7F5FE',
  card: '#FFFFFF',

  textPrimary: '#2A1B54',
  textSecondary: '#6E6395',
  textOnPrimary: '#FFFFFF',

  surface: '#F3EFFE',
  border: '#E3DAF8',
  shadow: '#4B32A0',

  qrBackground: '#FFFFFF',
  qrForeground: '#3B2478',

  // Attendance states
  present: '#1F8A63',
  presentSoft: '#DEF3EA',
  late: '#B26A12',
  lateSoft: '#FDF1DC',
  absent: '#C2435C',
  absentSoft: '#FBE8EC',

  // Semantic aliases
  success: '#1F8A63',
  successSoft: '#DEF3EA',
  warning: '#B26A12',
  warningSoft: '#FDF1DC',
  danger: '#C2435C',
  dangerSoft: '#FBE8EC',

  overlay: 'rgba(42, 27, 84, 0.82)',
  white: '#FFFFFF',
} as const;

export type ColorToken = keyof typeof COLORS;
