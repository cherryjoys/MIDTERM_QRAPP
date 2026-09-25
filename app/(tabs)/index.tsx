import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '@/components/AppButton';
import Header from '@/components/Header';
import { COLORS } from '@/constants/colors';
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
          <View style={styles.avatar}>
            <Ionicons
              name={isTeacher ? 'school-outline' : 'sparkles-outline'}
              size={25}
              color={COLORS.primary}
            />
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons
              name={isTeacher ? 'qr-code-outline' : 'scan-outline'}
              size={25}
              color={COLORS.primary}
            />
          </View>
          <Text style={styles.heroTitle}>
            {isTeacher ? 'Event attendance' : 'Attendance check-in'}
          </Text>
          {roleLoading ? (
            <View style={styles.heroLoading}>
              <ActivityIndicator size="small" color={COLORS.mint} />
              <Text style={styles.heroLoadingText}>Preparing your space...</Text>
            </View>
          ) : (
            <AppButton
              variant="secondary"
              title={isTeacher ? 'Create event QR' : 'Scan attendance'}
              icon={isTeacher ? 'add-circle-outline' : 'qr-code-outline'}
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
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: COLORS.mint,
  },
  heroLoadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginLeft: 10,
  },
});
