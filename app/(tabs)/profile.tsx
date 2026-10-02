import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import AppButton from '@/components/AppButton';
import Header from '@/components/Header';
import IconTile from '@/components/IconTile';
import { COLORS } from '@/constants/colors';
import { APP_ICONS } from '@/constants/icons';
import { signOut, useAuth } from '@/lib/auth';
import { getProfile, updateProfile, type Profile } from '@/lib/profiles';

export default function ProfileScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
  const editingRef = useRef(false);

  const loadProfile = useCallback(async () => {
    if (!user) {
      hasLoadedRef.current = true;
      setLoading(false);
      return;
    }

    if (!hasLoadedRef.current) {
      setLoading(true);
    }
    setLoadError(null);

    try {
      const nextProfile = await getProfile(user.id);
      setProfile(nextProfile);
      if (!editingRef.current) {
        setDraftName(nextProfile?.full_name ?? '');
      }
      if (!nextProfile) {
        setLoadError('Profile details unavailable.');
      }
    } catch {
      setLoadError('Could not load profile.');
    } finally {
      hasLoadedRef.current = true;
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile])
  );

  const handleSaveName = async () => {
    if (!user || saving) return;

    const nextName = draftName.trim();
    if (!nextName) {
      setSaveError('Please enter your name.');
      return;
    }

    setSaveError(null);
    setSaving(true);

    try {
      const { error } = await updateProfile(user.id, { full_name: nextName });
      if (error) {
        setSaveError('Could not save name.');
        return;
      }

      setProfile((current) => (current ? { ...current, full_name: nextName } : current));
      editingRef.current = false;
      setEditing(false);
    } catch {
      setSaveError('Could not save name.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    if (signingOut) return;

    setSigningOut(true);
    try {
      const { error } = await signOut();
      if (error) {
        Alert.alert('Could not sign out', error.message);
      }
    } catch {
      Alert.alert('Could not sign out', 'Try again.');
    } finally {
      setSigningOut(false);
    }
  };

  const metadataName = user?.user_metadata?.full_name;
  const displayName =
    profile?.full_name ||
    (typeof metadataName === 'string' && metadataName.trim() ? metadataName.trim() : '') ||
    user?.email?.split('@')[0] ||
    'Your profile';
  const role = profile?.role;
  const roleLabel = role === 'teacher' ? 'Teacher' : role === 'student' ? 'Student' : 'Unavailable';
  const initials = getInitials(displayName);

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
        <Header title="Profile" compact />

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <>
            <View style={styles.profileHero}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.profileCopy}>
                <Text style={styles.profileName}>{displayName}</Text>
                <Text style={styles.profileEmail}>{user?.email ?? 'Email unavailable'}</Text>
                <View style={styles.roleBadge}>
                  <Ionicons
                    name={
                      role === 'teacher'
                        ? 'briefcase-outline'
                        : role === 'student'
                          ? 'school-outline'
                          : 'information-circle-outline'
                    }
                    size={14}
                    color={COLORS.primaryDark}
                  />
                  <Text
                    style={styles.roleBadgeText}
                  >
                    {roleLabel}
                  </Text>
                </View>
              </View>
            </View>

            {loadError ? (
              <View accessibilityRole="alert" style={styles.errorBanner}>
                <Ionicons name="cloud-offline-outline" size={19} color={COLORS.danger} />
                <Text style={styles.errorText}>{loadError}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading profile"
                  onPress={() => void loadProfile()}
                  style={styles.retryButton}
                >
                  <Ionicons name={APP_ICONS.retry} size={15} color={COLORS.danger} />
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Account details</Text>
            </View>

            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <IconTile
                  name={APP_ICONS.user}
                  size={38}
                  style={styles.detailIcon}
                />
                <View style={styles.detailCopy}>
                  <Text style={styles.detailLabel}>Full name</Text>
                  <Text style={styles.detailValue}>{profile?.full_name || 'Not added yet'}</Text>
                </View>
                {!editing ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Edit full name"
                    onPress={() => {
                      setSaveError(null);
                      editingRef.current = true;
                      setEditing(true);
                    }}
                    style={styles.editButton}
                  >
                    <Ionicons name={APP_ICONS.edit} size={18} color={COLORS.primary} />
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.rowSeparator} />

              <View style={styles.detailRow}>
                <IconTile
                  name={APP_ICONS.mail}
                  size={38}
                  tone="neutral"
                  style={styles.detailIcon}
                />
                <View style={styles.detailCopy}>
                  <Text style={styles.detailLabel}>Email address</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>
                    {user?.email ?? 'Unavailable'}
                  </Text>
                </View>
              </View>

              {editing ? (
                <View style={styles.editPanel}>
                  <TextInput
                    accessibilityLabel="Edit full name"
                    style={styles.nameInput}
                    value={draftName}
                    onChangeText={setDraftName}
                    placeholder="Enter your name"
                    placeholderTextColor={COLORS.textSecondary}
                    autoFocus
                    editable={!saving}
                  />
                  {saveError ? <Text style={styles.editError}>{saveError}</Text> : null}
                  <View style={styles.editActions}>
                    <AppButton
                      compact
                      variant="primary"
                      title="Save name"
                      icon={APP_ICONS.save}
                      onPress={handleSaveName}
                      loading={saving}
                      disabled={saving}
                    />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Cancel editing name"
                      disabled={saving}
                      onPress={() => {
                        setDraftName(profile?.full_name ?? '');
                        setSaveError(null);
                        editingRef.current = false;
                        setEditing(false);
                      }}
                      style={styles.cancelButton}
                    >
                      <Ionicons name={APP_ICONS.close} size={17} color={COLORS.textSecondary} />
                      <Text style={styles.cancelText}>Cancel</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </View>

            <View style={styles.accountSection}>
              <Text style={[styles.sectionTitle, styles.accountTitle]}>Account</Text>
              <AppButton
                variant="danger"
                title="Sign out"
                icon="log-out-outline"
                onPress={handleSignOut}
                loading={signingOut}
                disabled={signingOut}
                accessibilityHint="Sign out of your account"
              />
            </View>
          </>
        )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getInitials(name: string | null | undefined) {
  if (!name?.trim()) return 'A';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
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
  profileHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    padding: 20,
    marginTop: 24,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  profileCopy: {
    flex: 1,
  },
  profileName: {
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '800',
    color: COLORS.textOnPrimary,
    marginBottom: 3,
  },
  profileEmail: {
    fontSize: 13,
    color: COLORS.primaryLight,
    marginBottom: 11,
  },
  roleBadge: {
    backgroundColor: COLORS.primaryLight,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginLeft: 5,
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
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 8,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.danger,
    marginLeft: 5,
  },
  sectionHeader: {
    marginTop: 28,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  accountTitle: {
    marginBottom: 12,
  },
  detailsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 67,
  },
  detailIcon: {
    marginRight: 12,
  },
  rowSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginLeft: 50,
  },
  detailCopy: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editPanel: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    marginVertical: 5,
  },
  nameInput: {
    minHeight: 48,
    backgroundColor: COLORS.card,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 13,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  editError: {
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.danger,
    marginTop: 8,
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 11,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
    marginLeft: 8,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  accountSection: {
    marginTop: 28,
  },
});
