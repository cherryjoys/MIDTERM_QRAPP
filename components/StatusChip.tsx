import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { STATUS_META, type StatusKey } from '@/constants/icons';

type Props = {
  status: StatusKey;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Attendance state pill: soft tinted background, small line glyph, short label. */
export default function StatusChip({ status, compact = false, style }: Props) {
  const meta = STATUS_META[status];
  const glyphSize = compact ? 12 : 13;

  return (
    <View
      accessibilityLabel={meta.label}
      style={[
        styles.chip,
        compact && styles.compactChip,
        { backgroundColor: meta.soft },
        style,
      ]}
    >
      <Ionicons name={meta.icon} size={glyphSize} color={meta.color} />
      <Text style={[styles.label, compact && styles.compactLabel, { color: meta.color }]}>
        {meta.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  compactChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginLeft: 4,
  },
  compactLabel: {
    fontSize: 10,
  },
});
