import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '@/components/AppButton';
import Header from '@/components/Header';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import {
  getAttendanceHistory,
  getTeacherEventAttendance,
  getTeacherEventSummary,
  type AttendanceRecord,
  type TeacherEventAttendance,
  type TeacherEventSummary,
} from '@/lib/attendance';
import { useRole } from '@/lib/useRole';

export default function HistoryScreen() {
  const { user } = useAuth();
  const { role, loading: roleLoading } = useRole();
  const [studentRecords, setStudentRecords] = useState<AttendanceRecord[]>([]);
  const [teacherSummary, setTeacherSummary] = useState<TeacherEventSummary[]>([]);
  const [expandedDetail, setExpandedDetail] =
    useState<TeacherEventAttendance | null>(null);
  const [expandingEventId, setExpandingEventId] = useState<string | null>(null);
  const [expanding, setExpanding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (roleLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (role === 'teacher') {
        const summary = await getTeacherEventSummary(user.id);
        setTeacherSummary(summary);
        setStudentRecords([]);
        setExpandedDetail(null);
      } else if (role === 'student') {
        const records = await getAttendanceHistory(user.id);
        setStudentRecords(records);
        setTeacherSummary([]);
        setExpandedDetail(null);
      } else {
        setStudentRecords([]);
        setTeacherSummary([]);
      }
    } catch {
      setError('Could not load history.');
    } finally {
      setLoading(false);
    }
  }, [user, role, roleLoading]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const handleExpand = async (eventId: string) => {
    if (!user || expanding) return;

    if (expandedDetail?.eventId === eventId) {
      setExpandedDetail(null);
      return;
    }

    setExpanding(true);
    setExpandingEventId(eventId);
    setExpandedDetail(null);
    setError(null);

    try {
      const events = await getTeacherEventAttendance(user.id);
      const detail = events.find((event) => event.eventId === eventId) ?? null;
      if (!detail) {
        setError('Could not load attendees.');
        return;
      }
      setExpandedDetail(detail);
    } catch {
      setError('Could not load attendees.');
    } finally {
      setExpanding(false);
      setExpandingEventId(null);
    }
  };

  const screenTitle = 'History';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {loading ? (
        <View style={styles.screen}>
           <Header title={screenTitle} compact />
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        </View>
      ) : role === 'teacher' ? (
        <View style={styles.screen}>
          <Header title={screenTitle} compact />
          {error ? <ErrorBanner message={error} onRetry={() => void load()} /> : null}
          {teacherSummary.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title="No events yet"
              buttonTitle="Create event"
              onPress={() => router.push('/teacher')}
            />
          ) : (
            <ScrollView
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {teacherSummary.map((item) => {
                const isExpanded =
                  expandedDetail?.eventId === item.eventId || expandingEventId === item.eventId;
                return (
                  <View key={item.eventId} style={styles.card}>
                    <Pressable
                      accessibilityRole="button"
                       accessibilityLabel={`${item.title}, ${item.attendeeCount} ${
                         item.attendeeCount === 1 ? 'attendee' : 'attendees'
                       }`}
                      accessibilityState={{ expanded: isExpanded }}
                      disabled={expanding}
                      onPress={() => void handleExpand(item.eventId)}
                      style={({ pressed }) => [styles.cardHeader, pressed && styles.cardPressed]}
                    >
                      <View style={styles.cardTitleCopy}>
                        <Text style={styles.eventTitle}>{item.title}</Text>
                        <Text style={styles.eventCode}>{item.eventCode}</Text>
                      </View>
                      <View style={styles.countBadge}>
                        <Ionicons name="people-outline" size={14} color={COLORS.primary} />
                        <Text style={styles.countBadgeText}>{item.attendeeCount}</Text>
                      </View>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={19}
                        color={COLORS.textSecondary}
                      />
                    </Pressable>

                    {item.startTime ? (
                      <View style={styles.metaRow}>
                        <Ionicons name="calendar-outline" size={15} color={COLORS.textSecondary} />
                        <Text style={styles.eventMeta}>{formatDate(item.startTime)}</Text>
                      </View>
                    ) : null}

                    {!isExpanded && item.attendeeCount > 0 ? (
                       <Text style={styles.expandHint}>View attendees</Text>
                    ) : null}

                    {isExpanded ? (
                      <View style={styles.detailSection}>
                        <View style={styles.separator} />
                        {expanding ? (
                          <View style={styles.detailLoading}>
                            <ActivityIndicator size="small" color={COLORS.primary} />
                             <Text style={styles.detailLoadingText}>Loading attendees</Text>
                          </View>
                        ) : expandedDetail && expandedDetail.attendees.length === 0 ? (
                          <View style={styles.emptyDetail}>
                            <Ionicons name="people-outline" size={20} color={COLORS.textSecondary} />
                             <Text style={styles.emptyDetailText}>No check-ins yet</Text>
                          </View>
                        ) : (
                          expandedDetail?.attendees.map((attendee) => (
                            <View key={attendee.studentId} style={styles.attendeeRow}>
                              <View style={styles.attendeeAvatar}>
                                <Text style={styles.attendeeAvatarText}>
                                  {getInitials(attendee.studentName)}
                                </Text>
                              </View>
                              <View style={styles.attendeeCopy}>
                                <Text style={styles.attendeeText} numberOfLines={1}>
                                  {attendee.studentName || 'Student account'}
                                </Text>
                                <Text style={styles.attendeeMeta}>
                                  Checked in {formatDate(attendee.scannedAt)}
                                </Text>
                              </View>
                            </View>
                          ))
                        )}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      ) : role === 'student' ? (
        <View style={styles.screen}>
          <Header title={screenTitle} compact />
          {error ? <ErrorBanner message={error} onRetry={() => void load()} /> : null}
          {studentRecords.length === 0 ? (
            <EmptyState
              icon="qr-code-outline"
              title="No attendance yet"
              buttonTitle="Scan a QR"
              onPress={() => router.push('/scan')}
            />
          ) : (
            <FlatList
              data={studentRecords}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => <StudentRecord item={item} />}
            />
          )}
        </View>
      ) : (
        <View style={styles.screen}>
          <Header title={screenTitle} compact />
          <EmptyState
            icon="person-outline"
            title="Role unavailable"
            buttonTitle="Retry"
            onPress={() => void load()}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

type ErrorBannerProps = {
  message: string;
  onRetry: () => void;
};

function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <View accessibilityRole="alert" style={styles.errorBanner}>
      <Ionicons name="alert-circle-outline" size={19} color={COLORS.danger} />
      <Text style={styles.errorText}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retry loading history"
        onPress={onRetry}
        style={styles.retryButton}
      >
        <Text style={styles.retryText}>Retry</Text>
      </Pressable>
    </View>
  );
}

type EmptyStateProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  buttonTitle: string;
  onPress: () => void;
};

function EmptyState({ icon, title, buttonTitle, onPress }: EmptyStateProps) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={30} color={COLORS.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <AppButton
        title={buttonTitle}
        icon={
          icon === 'calendar-outline'
            ? 'add-circle-outline'
            : icon === 'person-outline'
              ? 'refresh-outline'
              : 'qr-code-outline'
        }
        onPress={onPress}
        variant="secondary"
      />
    </View>
  );
}

function StudentRecord({ item }: { item: AttendanceRecord }) {
  return (
    <View style={styles.card}>
      <View style={styles.studentRecordTop}>
        <View style={styles.recordIcon}>
          <Ionicons name="checkmark-circle-outline" size={21} color={COLORS.primary} />
        </View>
        <View style={styles.recordCopy}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {item.eventTitle || 'School event'}
          </Text>
          <Text style={styles.eventCode}>{item.eventId || 'Event code unavailable'}</Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        <Ionicons name="time-outline" size={15} color={COLORS.textSecondary} />
        <Text style={styles.eventMeta}>Recorded {formatDate(item.scannedAt)}</Text>
      </View>
    </View>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getInitials(name: string | null) {
  if (!name?.trim()) return 'S';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screen: {
    flex: 1,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  loadingCard: {
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 24,
    paddingVertical: 42,
    marginTop: 24,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
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
  retryButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.danger,
  },
  listContent: {
    paddingTop: 18,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardPressed: {
    opacity: 0.76,
  },
  cardTitleCopy: {
    flex: 1,
    paddingRight: 10,
  },
  eventTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  eventCode: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 4,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.mint,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
    marginRight: 8,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginLeft: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  eventMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  expandHint: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  detailSection: {
    marginTop: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginVertical: 13,
  },
  detailLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  detailLoadingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 9,
  },
  emptyDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  emptyDetailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  attendeeAvatar: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  attendeeAvatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  attendeeCopy: {
    flex: 1,
  },
  attendeeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  attendeeMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 22,
    paddingVertical: 32,
    marginTop: 22,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 7,
  },
  studentRecordTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  recordCopy: {
    flex: 1,
    paddingRight: 8,
  },
});
