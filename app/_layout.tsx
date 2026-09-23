import { Redirect, Stack, useSegments } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { COLORS } from '@/constants/colors';
import { AuthProvider, useAuth } from '@/lib/auth';

function RootNavigator() {
  const { session, loading } = useAuth();
  const segments = useSegments();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" />
      </Stack>

      {!session && !inAuthGroup && <Redirect href="/login" />}
      {session && inAuthGroup && <Redirect href="/" />}
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}