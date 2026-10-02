import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';

import AppButton from '@/components/AppButton';
import Header from '@/components/Header';
import IconTile from '@/components/IconTile';
import { COLORS } from '@/constants/colors';
import { APP_ICONS } from '@/constants/icons';
import {
  DEFAULT_LATE_AFTER_MINUTES,
  createEvent,
  normalizeRoster,
} from '@/lib/events';
import { buildQRPayload } from '@/lib/qr';
import { useRole } from '@/lib/useRole';

function toLocalISO(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
  );
}

function formatDateTime(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short' });
  return `${month} ${pad(date.getDate())}, ${date.getFullYear()} at ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

const QUICK_END_OPTIONS = [
  { label: '+30 min', ms: 30 * 60 * 1000 },
  { label: '+1 hour', ms: 60 * 60 * 1000 },
  { label: '+2 hours', ms: 2 * 60 * 60 * 1000 },
];

type EditTarget = 'start' | 'end';

export default function TeacherScreen() {
  const { role, loading: roleLoading } = useRole();
  const [title, setTitle] = useState('');
  const [eventId, setEventId] = useState('');
  const [startDate, setStartDate] = useState(() => new Date());
  const [endDate, setEndDate] = useState(
    () => new Date(Date.now() + 60 * 60 * 1000)
  );
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [editingPart, setEditingPart] = useState<'date' | 'time'>('date');
  const [roster, setRoster] = useState('');
  const [lateAfter, setLateAfter] = useState(String(DEFAULT_LATE_AFTER_MINUTES));
  const [payload, setPayload] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const isAndroid = Platform.OS === 'android';
  const rosterNames = normalizeRoster(roster);
  const lateAfterMinutes = Number.parseInt(lateAfter, 10);

  const clearFeedback = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setPayload(null);
  };

  const openPicker = (target: EditTarget) => {
    clearFeedback();
    setEditTarget(target);
    setEditingPart('date');
  };

  const onPickerChange = (
    event: DateTimePickerEvent,
    selected?: Date
  ) => {
    if (!editTarget) return;
    if (event.type === 'dismissed' || !selected) {
      setEditTarget(null);
      setEditingPart('date');
      return;
    }

    const current = editTarget === 'start' ? startDate : endDate;
    const next = new Date(current);
    next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);

    if (editTarget === 'start') setStartDate(next);
    else setEndDate(next);

    if (isAndroid && editingPart === 'date') {
      setEditingPart('time');
    } else {
      setEditTarget(null);
      setEditingPart('date');
    }
  };

  const handleQuickEnd = (ms: number) => {
    clearFeedback();
    setEndDate(new Date(startDate.getTime() + ms));
  };

  const handleCreateEvent = async () => {
    if (creating) return;

    const event = {
      eventId: eventId.trim(),
      title: title.trim(),
      start: toLocalISO(startDate),
      end: toLocalISO(endDate),
      lateAfterMinutes: Number.isFinite(lateAfterMinutes)
        ? lateAfterMinutes
        : DEFAULT_LATE_AFTER_MINUTES,
      expectedStudents: rosterNames,
    };

    setErrorMessage(null);
    setSuccessMessage(null);
    setPayload(null);

    if (!event.eventId || !event.title) {
      setErrorMessage('Event title and code are required.');
      return;
    }

    if (endDate.getTime() <= startDate.getTime()) {
      setErrorMessage('End time must be after start time.');
      return;
    }

    setCreating(true);

    try {
      const { error } = await createEvent(event);
      if (error) {
        setErrorMessage('Could not save event.');
        return;
      }

      setSuccessMessage('Event saved.');
      setPayload(buildQRPayload(event));
    } catch {
      setErrorMessage('Could not save the event. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  if (roleLoading) {
    return <TeacherStatus loading title="Checking your account" />;
  }

  if (role !== 'teacher') {
    return (
      <TeacherStatus
        icon={APP_ICONS.lock}
        title="Teachers only"
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <Header title="New event" compact />

          <View style={styles.formCard}>
            <Text style={styles.label}>Event title</Text>
            <View style={styles.inputShell}>
              <Ionicons name={APP_ICONS.sparkle} size={20} color={COLORS.textSecondary} />
              <TextInput
                accessibilityLabel="Event title"
                style={styles.input}
                value={title}
                onChangeText={(value) => {
                  setTitle(value);
                  clearFeedback();
                }}
                placeholder="e.g. Founders' Day"
                placeholderTextColor={COLORS.textSecondary}
                editable={!creating}
              />
            </View>

            <Text style={[styles.label, styles.spacedLabel]}>Event code</Text>
            <View style={styles.inputShell}>
              <Ionicons name="key-outline" size={20} color={COLORS.textSecondary} />
              <TextInput
                accessibilityLabel="Event code"
                style={styles.input}
                value={eventId}
                onChangeText={(value) => {
                  setEventId(value);
                  clearFeedback();
                }}
                placeholder="e.g. EVT-2026-0002"
                placeholderTextColor={COLORS.textSecondary}
                autoCapitalize="characters"
                editable={!creating}
              />
            </View>

            <Text style={[styles.label, styles.spacedLabel]}>Expected students</Text>
            <View style={[styles.inputShell, styles.rosterShell]}>
              <Ionicons
                name={APP_ICONS.roster}
                size={20}
                color={COLORS.textSecondary}
                style={styles.rosterIcon}
              />
              <TextInput
                accessibilityLabel="Expected students"
                accessibilityHint="Separate names with commas. Anyone on this list who does not scan is marked absent."
                style={[styles.input, styles.rosterInput]}
                value={roster}
                onChangeText={(value) => {
                  setRoster(value);
                  clearFeedback();
                }}
                placeholder="e.g. Juan Dela Cruz, Maria Santos"
                placeholderTextColor={COLORS.textSecondary}
                multiline
                editable={!creating}
              />
            </View>
            <Text style={styles.fieldHint}>
              {rosterNames.length === 0
                ? 'Optional. Anyone listed here who never scans is marked absent.'
                : `${rosterNames.length} student${
                    rosterNames.length === 1 ? '' : 's'
                  } expected`}
            </Text>

            <Text style={[styles.label, styles.spacedLabel]}>Late after (minutes)</Text>
            <View style={styles.inputShell}>
              <Ionicons name={APP_ICONS.timer} size={20} color={COLORS.textSecondary} />
              <TextInput
                accessibilityLabel="Minutes after start before a student counts as late"
                style={styles.input}
                value={lateAfter}
                onChangeText={(value) => {
                  setLateAfter(value.replace(/[^0-9]/g, '').slice(0, 3));
                  clearFeedback();
                }}
                placeholder={String(DEFAULT_LATE_AFTER_MINUTES)}
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="number-pad"
                editable={!creating}
              />
            </View>
            <Text style={styles.fieldHint}>
              Scans after this many minutes count as late instead of present.
            </Text>

            <Text style={[styles.label, styles.spacedLabel]}>Starts</Text>

          <PickerField
            value={formatDateTime(startDate)}
            onPress={() => openPicker('start')}
            disabled={creating}
          />

          <Text style={[styles.label, styles.spacedLabel]}>Ends</Text>
          <PickerField
            value={formatDateTime(endDate)}
            onPress={() => openPicker('end')}
            disabled={creating}
          />
          <View style={styles.chipRow}>
            {QUICK_END_OPTIONS.map((option) => (
              <Pressable
                key={option.label}
                accessibilityRole="button"
                accessibilityLabel={`Set end time ${option.label}`}
                disabled={creating}
                onPress={() => handleQuickEnd(option.ms)}
                style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
              >
                <Text style={styles.chipText}>{option.label}</Text>
              </Pressable>
            ))}
          </View>

          {errorMessage ? (
            <View accessibilityRole="alert" style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={19} color={COLORS.danger} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {successMessage ? (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle-outline" size={19} color={COLORS.present} />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}

          <AppButton
            theme="primary"
            title="Create event QR"
            icon={APP_ICONS.add}
            onPress={handleCreateEvent}
            loading={creating}
            disabled={creating}
            style={styles.submitButton}
            accessibilityHint="Save the event and generate its attendance QR code"
          />
        </View>

        {editTarget ? (
          <View style={styles.pickerContainer}>
            <DateTimePicker
              value={editTarget === 'start' ? startDate : endDate}
              mode={isAndroid ? editingPart : 'datetime'}
              display={isAndroid ? 'default' : 'spinner'}
              onChange={onPickerChange}
            />
          </View>
        ) : null}

        {payload ? (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <IconTile name={APP_ICONS.qr} size={36} style={styles.resultHeaderIcon} />
              <Text style={styles.resultTitle}>QR ready</Text>
            </View>
            <View style={styles.qrBox}>
              <QRCode
                value={payload}
                size={200}
                color={COLORS.qrForeground}
                backgroundColor={COLORS.qrBackground}
              />
            </View>
             <Text style={styles.resultText}>Share with attendees.</Text>
            {eventId.trim() ? (
              <View style={styles.codeBadge}>
                 <Text style={styles.codeLabel}>Code</Text>
                <Text style={styles.codeValue}>{eventId.trim()}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type PickerFieldProps = {
  value: string;
  onPress: () => void;
  disabled?: boolean;
};

function PickerField({ value, onPress, disabled = false }: PickerFieldProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${value}. Change date and time`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pickerField,
        pressed && !disabled && styles.pickerFieldPressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={styles.pickerValue}>{value}</Text>
      <Ionicons name={APP_ICONS.calendar} size={18} color={COLORS.textSecondary} />
    </Pressable>
  );
}

type TeacherStatusProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  loading?: boolean;
};

function TeacherStatus({ icon, title, loading = false }: TeacherStatusProps) {
  return (
    <SafeAreaView style={styles.statusScreen} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.statusContent}>
        <View style={styles.statusIcon}>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : (
            <Ionicons name={icon ?? 'information-circle-outline'} size={38} color={COLORS.primary} />
          )}
        </View>
        <Text style={styles.statusTitle}>{title}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginTop: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  spacedLabel: {
    marginTop: 17,
  },
  fieldHint: {
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.textSecondary,
    marginTop: 7,
  },
  inputShell: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingLeft: 15,
    paddingRight: 12,
  },
  rosterShell: {
    minHeight: 96,
    alignItems: 'flex-start',
    paddingTop: 15,
    paddingBottom: 12,
  },
  rosterIcon: {
    marginTop: 2,
  },
  rosterInput: {
    minHeight: 68,
    textAlignVertical: 'top',
    paddingTop: 0,
  },
  input: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 0,
    fontSize: 15,
    color: COLORS.textPrimary,
    includeFontPadding: false,
  },
  pickerField: {
    minHeight: 56,
    backgroundColor: COLORS.surface,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerFieldPressed: {
    backgroundColor: COLORS.primaryLight,
  },
  pickerValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginHorizontal: 10,
  },
  chipRow: {
    flexDirection: 'row',
    marginTop: 9,
  },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 12,
    marginRight: 7,
  },
  chipPressed: {
    opacity: 0.72,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.dangerSoft,
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 11,
    marginTop: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.danger,
    marginLeft: 9,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.successSoft,
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 11,
    marginTop: 16,
  },
  successText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.success,
    marginLeft: 9,
  },
  submitButton: {
    marginTop: 22,
  },
  pickerContainer: {
    alignItems: 'center',
    marginTop: 14,
  },
  resultCard: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginTop: 18,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultHeaderIcon: {
    marginRight: 11,
  },
  resultTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  qrBox: {
    alignSelf: 'center',
    backgroundColor: COLORS.qrBackground,
    borderRadius: 18,
    padding: 15,
  },
  resultText: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 15,
  },
  codeBadge: {
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 14,
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  codeValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginTop: 3,
  },
  statusScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  statusContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  statusIcon: {
    width: 82,
    height: 82,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  disabled: {
    opacity: 0.5,
  },
});
