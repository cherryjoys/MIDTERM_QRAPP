import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/colors';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Ionicons name="map-outline" size={42} color={COLORS.primaryLight} />
          </View>
          <Text style={styles.title}>Page not found</Text>
          <Link href="/" asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back to home"
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            >
              <Text style={styles.buttonText}>Back to home</Text>
              <Ionicons name="arrow-forward" size={19} color={COLORS.textOnPrimary} />
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 26,
  },
  button: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingHorizontal: 20,
  },
  buttonPressed: {
    opacity: 0.82,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textOnPrimary,
    marginRight: 9,
  },
});
