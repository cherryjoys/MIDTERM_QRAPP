import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { COLORS } from '@/constants/colors';
import type { IconName } from '@/constants/icons';

export type IconTileTone = 'primary' | 'neutral' | 'present' | 'late' | 'absent';

const TONES: Record<IconTileTone, { background: string; color: string }> = {
  primary: { background: COLORS.primaryLight, color: COLORS.primary },
  neutral: { background: COLORS.surface, color: COLORS.textSecondary },
  present: { background: COLORS.presentSoft, color: COLORS.present },
  late: { background: COLORS.lateSoft, color: COLORS.late },
  absent: { background: COLORS.absentSoft, color: COLORS.absent },
};

type Props = {
  name: IconName;
  /** Edge length of the rounded tile. */
  size?: number;
  tone?: IconTileTone;
  round?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * A small glyph sitting in a soft rounded tile. Use it for list rows, empty
 * states and card headers so icons read as one consistent family.
 */
export default function IconTile({
  name,
  size = 40,
  tone = 'primary',
  round = false,
  style,
}: Props) {
  const { background, color } = TONES[tone];
  const glyphSize = Math.round(size * 0.44);

  return (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: round ? size / 2 : Math.round(size * 0.33),
          backgroundColor: background,
        },
        style,
      ]}
    >
      <Ionicons name={name} size={glyphSize} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
