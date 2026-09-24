import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import AppButton from '@/components/AppButton';
import Header from '@/components/Header';
import { COLORS } from '@/constants/colors';
import { signOut, useAuth } from '@/lib/auth';
import { getProfile, updateProfile, type Profile } from '@/lib/profiles';

export default function ProfileScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    const p = await getProfile(user.id);
    setProfile(p);
    setDraftName(p?.full_name ?? '');
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleSaveName = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await updateProfile(user.id, {
      full_name: draftName.trim(),
    });
    setSaving(false);
    if (error) {
      Alert.alert('Error', error);
    } else {
      setProfile((prev) =>
        prev ? { ...prev, full_name: draftName.trim() } : prev
      );
      setEditing(false);
    }
  };

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

        <View
          style={[
            styles.roleBadge,
            profile?.role === 'teacher'
              ? styles.roleBadgeTeacher
              : styles.roleBadgeStudent,
          ]}
        >
          <Text style={styles.roleBadgeText}>
            {profile?.role === 'teacher' ? 'Teacher' : 'Student'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Full Name</Text>
          {editing ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={styles.nameInput}
                value={draftName}
                onChangeText={setDraftName}
                placeholder="Your name"
                placeholderTextColor={COLORS.textSecondary}
                editable={!saving}
              />
              <Pressable
                style={styles.saveButton}
                onPress={handleSaveName}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Saving...' : 'Save'}
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => setEditing(true)}
              style={styles.nameRow}
            >
              <Text style={styles.value}>
                {profile?.full_name || 'Tap to add your name'}
              </Text>
              <Text style={styles.editHint}>Edit</Text>
            </Pressable>
          )}

          <View style={styles.separator} />

          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email ?? 'Unknown'}</Text>

          <View style={styles.separator} />

          <Text style={styles.label}>User ID</Text>
          <Text style={styles.idText}>{user?.id ?? 'Unknown'}</Text>
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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  headerContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  bodyContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    marginBottom: 16,
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  roleBadge: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 12,
  },
  roleBadgeTeacher: {
    backgroundColor: COLORS.primary,
  },
  roleBadgeStudent: {
    backgroundColor: COLORS.textSecondary,
  },
  roleBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textOnPrimary,
  },
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
  label: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  idText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  nameRow: {
    alignItems: 'center',
  },
  editHint: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 4,
  },
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  nameInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginLeft: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textOnPrimary,
  },
  separator: {
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: COLORS.primaryDark,
    opacity: 0.2,
    marginVertical: 12,
  },
  footerContainer: {
    flex: 1 / 3,
    alignItems: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },
});