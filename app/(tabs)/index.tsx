import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '@/components/AppButton';
import Header from '@/components/Header';
import IconTile from '@/components/IconTile';
import { COLORS } from '@/constants/colors';
import { APP_ICONS } from '@/constants/icons';
import { useAuth } from '@/lib/auth';
import { useRole } from '@/lib/useRole';

export default function Index() {
  const { user } = useAuth();
  const { role, loading: roleLoading } = useRole();
  const isTeacher = role === 'teacher';
  const metadataName = user?.user_metadata?.full_name;
  const displayName =
    typeof metadataName === 'string' && metadataName.trim()
      ? metadataName.trim()
      : user?.email?.split('@')[0] || 'there';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Header title="QR Attendance" compact />

        <View style={styles.welcomeRow}>
          <View style={styles.welcomeCopy}>
            <Text style={styles.welcomeTitle}>
              {isTeacher ? 'Teacher tools' : `Hello, ${displayName}`}
            </Text>
          </View>
          <IconTile
            name={isTeacher ? 'school-outline' : APP_ICONS.sparkle}
            size={56}
            style={styles.avatar}
          />
        </View>

        <View style={styles.heroCard}>
          <IconTile
            name={isTeacher ? APP_ICONS.qr : APP_ICONS.scan}
            size={48}
            style={styles.heroIcon}
          />
          <Text style={styles.heroTitle}>
            {isTeacher ? 'Event attendance' : 'Attendance check-in'}
          </Text>
          {roleLoading ? (
            <View style={styles.heroLoading}>
              <ActivityIndicator size="small" color={COLORS.primaryLight} />
              <Text style={styles.heroLoadingText}>Preparing your space...</Text>
            </View>
          ) : (
            <AppButton
              variant="secondary"
              title={isTeacher ? 'Create event QR' : 'Scan attendance'}
              icon={isTeacher ? APP_ICONS.add : APP_ICONS.qr}
              onPress={() => router.push(isTeacher ? '/teacher' : '/scan')}
              accessibilityHint={isTeacher ? 'Open the event creator' : 'Open the QR scanner'}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 22,
  },
  welcomeCopy: {
    flex: 1,
    paddingRight: 14,
  },
  welcomeTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: COLORS.textPrimary,
  },
  avatar: {
    marginLeft: 4,
  },
  heroCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    padding: 22,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 4,
  },
  heroIcon: {
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '800',
    color: COLORS.textOnPrimary,
    marginBottom: 18,
  },
  heroLoading: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
  },
  heroLoadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginLeft: 10,
  },
});
