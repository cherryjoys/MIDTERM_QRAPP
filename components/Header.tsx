import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';
import { APP_ICONS } from '@/constants/icons';

type Props = {
  title: string;
  compact?: boolean;
  centered?: boolean;
};

export default function Header({ title, compact = false, centered = false }: Props) {
  return (
    <View
      style={[
        styles.container,
        compact && styles.compactContainer,
        centered && styles.centeredContainer,
      ]}
    >
      <View
        style={[
          styles.logoCircle,
          compact && styles.compactLogoCircle,
          centered && styles.centeredLogoCircle,
        ]}
      >
        <Ionicons
          name={APP_ICONS.qr}
          size={compact ? 25 : 32}
          color={COLORS.primaryLight}
        />
      </View>
      <View style={[styles.copy, centered && styles.centeredCopy]}>
        <Text
          accessibilityRole="header"
          style={[styles.title, compact && styles.compactTitle]}
        >
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 22,
  },
  compactContainer: {
    paddingVertical: 8,
  },
  centeredContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  centeredLogoCircle: {
    marginRight: 0,
    marginBottom: 14,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  compactLogoCircle: {
    width: 50,
    height: 50,
    borderRadius: 17,
    marginRight: 12,
  },
  copy: {
    flex: 1,
  },
  centeredCopy: {
    flex: 0,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  compactTitle: {
    fontSize: 21,
  },
});
