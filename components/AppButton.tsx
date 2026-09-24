import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';

type Props = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  theme?: 'primary';
  onPress: () => void;
};

export default function AppButton({ title, icon, theme, onPress }: Props) {
  const isPrimary = theme === 'primary';

  return (
    <View style={styles.buttonOuter}>
      <Pressable
        style={[
          styles.buttonInner,
          isPrimary ? styles.primaryFill : styles.secondaryFill,
        ]}
        onPress={onPress}
      >
        <Ionicons
          name={icon}
          size={22}
          color={isPrimary ? COLORS.textOnPrimary : COLORS.textSecondary}
          style={styles.icon}
        />
        <Text style={[styles.label, isPrimary && styles.primaryLabel]}>
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
  buttonInner: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryFill: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  secondaryFill: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
  },
  icon: { paddingRight: 10 },
  label: { fontSize: 17, fontWeight: '600', color: COLORS.textPrimary },
  primaryLabel: { fontSize: 17, fontWeight: '700', color: COLORS.textOnPrimary },
});