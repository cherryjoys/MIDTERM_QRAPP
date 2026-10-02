import Ionicons from '@expo/vector-icons/Ionicons';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { COLORS } from '@/constants/colors';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  theme?: 'primary';
  variant?: ButtonVariant;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

export default function AppButton({
  title,
  icon,
  theme,
  variant,
  onPress,
  loading = false,
  disabled = false,
  compact = false,
  style,
  accessibilityHint,
}: Props) {
  const buttonVariant = variant ?? (theme === 'primary' ? 'primary' : 'secondary');
  const isDisabled = disabled || loading;
  const isPrimary = buttonVariant === 'primary';

  return (
    <View style={[styles.buttonOuter, compact && styles.compactOuter, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        disabled={isDisabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.buttonInner,
          compact && styles.compactInner,
          buttonVariant === 'primary' && styles.primaryFill,
          buttonVariant === 'secondary' && styles.secondaryFill,
          buttonVariant === 'ghost' && styles.ghostFill,
          buttonVariant === 'danger' && styles.dangerFill,
          pressed && !isDisabled && styles.pressed,
          isDisabled && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={isPrimary ? COLORS.textOnPrimary : COLORS.primary}
            style={styles.loadingIndicator}
          />
        ) : (
          <Ionicons
            name={icon}
            size={compact ? 18 : 21}
            color={
              isPrimary
                ? COLORS.textOnPrimary
                : buttonVariant === 'danger'
                  ? COLORS.danger
                  : COLORS.primary
            }
            style={styles.icon}
          />
        )}
        <Text
          style={[
            styles.label,
            isPrimary ? styles.primaryLabel : styles.secondaryLabel,
            buttonVariant === 'danger' && styles.dangerLabel,
          ]}
        >
          {title}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonOuter: {
    width: '100%',
    marginBottom: 14,
  },
  compactOuter: {
    width: 'auto',
    alignSelf: 'flex-start',
    marginBottom: 0,
  },
  buttonInner: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  compactInner: {
    minHeight: 44,
    borderRadius: 13,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  primaryFill: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  secondaryFill: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  ghostFill: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  dangerFill: {
    backgroundColor: COLORS.dangerSoft,
    borderColor: COLORS.dangerSoft,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.75,
  },
  icon: {
    paddingRight: 10,
  },
  loadingIndicator: {
    marginRight: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
  primaryLabel: {
    color: COLORS.textOnPrimary,
  },
  secondaryLabel: {
    color: COLORS.primary,
  },
  dangerLabel: {
    color: COLORS.danger,
  },
});
