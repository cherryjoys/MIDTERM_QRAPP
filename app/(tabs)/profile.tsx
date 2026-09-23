import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import Header from '@/components/Header';
import { COLORS } from '@/constants/colors';
import { signOut, useAuth } from '@/lib/auth';

export default function ProfileScreen() {
  const { user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Header title="QR Attendance" />
      </View>

      <View style={styles.bodyContainer}>
        <Text style={styles.title}>My Profile</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Signed in as</Text>
          <Text style={styles.email}>{user?.email ?? 'Unknown'}</Text>
        </View>
      </View>

      <View style={styles.footerContainer}>
        <AppButton
          theme="primary"
          title="Sign Out"
          icon="log-out-outline"
          onPress={handleSignOut}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center' },
  headerContainer: { flex: 1, justifyContent: 'center' },
  bodyContainer: { alignItems: 'center', paddingHorizontal: 32, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 12 },
  card: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  label: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  email: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  footerContainer: { flex: 1 / 3, alignItems: 'center', paddingHorizontal: 24, width: '100%' },
});