import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import AppButton from '@/components/AppButton';
import StatusChip from '@/components/StatusChip';
import { COLORS } from '@/constants/colors';
import { APP_ICONS, STATUS_META } from '@/constants/icons';
import { useAuth } from '@/lib/auth';
import { registerAttendance, type ScannedStatus } from '@/lib/attendance';
import { useRole } from '@/lib/useRole';

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { role, loading: roleLoading } = useRole();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState<string | null>(null);
  const [status, setStatus] = useState<ScannedStatus | null>(null);
  const [success, setSuccess] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const scanLock = useRef(false);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanLock.current || !user) return;

    scanLock.current = true;
    setScanned(true);
    setProcessing(true);
    setMessage(null);
    setEventTitle(null);
    setStatus(null);
    setSuccess(false);

    void registerAttendance(data, user.id)
      .then((result) => {
        setMessage(result.message);
        setEventTitle(result.eventTitle ?? null);
        setStatus(result.success ? (result.status ?? 'present') : null);
        setSuccess(result.success);
      })
      .catch(() => {
        setMessage('Please try again.');
        setSuccess(false);
      })
      .finally(() => {
        setProcessing(false);
      });
  };

  const handleScanAgain = () => {
    scanLock.current = false;
    setScanned(false);
    setProcessing(false);
    setMessage(null);
    setEventTitle(null);
    setStatus(null);
    setSuccess(false);
  };

  if (roleLoading) {
    return <StatusScreen loading title="Checking your account" />;
  }

  if (role !== 'student') {
    return (
      <StatusScreen
        icon={APP_ICONS.lock}
        title="Students only"
      />
    );
  }

  if (!permission) {
    return <StatusScreen loading title="Preparing the scanner" />;
  }

  if (!permission.granted) {
    return (
      <StatusScreen
        icon={APP_ICONS.camera}
         title="Camera access needed"
         description="Allow camera access to scan."
      >
        <AppButton
          theme="primary"
          title="Allow camera"
          icon={APP_ICONS.camera}
          onPress={() => void requestPermission()}
          accessibilityHint="Allow camera access for QR scanning"
        />
      </StatusScreen>
    );
  }

  return (
    <View style={styles.scanner}>
      <StatusBar style="light" />
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torchOn}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      <View
        style={[styles.scannerTop, { paddingTop: insets.top + 12 }]}
        pointerEvents="box-none"
      >
        <View style={styles.topBar}>
          <View style={styles.topCopy}>
            <Ionicons name={APP_ICONS.qr} size={18} color={COLORS.primaryLight} />
            <Text accessibilityRole="header" style={styles.topTitle}>Scan QR</Text>
          </View>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: torchOn }}
            accessibilityLabel="Flashlight"
            hitSlop={10}
            onPress={() => setTorchOn((current) => !current)}
            style={({ pressed }) => [styles.topAction, pressed && styles.topActionPressed]}
          >
            <Ionicons
              name={torchOn ? 'flash-off-outline' : 'flashlight-outline'}
              size={19}
              color={COLORS.primaryLight}
            />
          </Pressable>
        </View>
      </View>

      <View style={styles.guide} pointerEvents="none">
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.cornerTopLeft]} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />
           <Ionicons name={APP_ICONS.scan} size={35} color={COLORS.primaryLight} />
        </View>
          <View style={styles.guideCopy}>
            <Text accessibilityRole="header" style={styles.guideText}>Point at the event QR</Text>
          </View>
      </View>

      {scanned ? (
        <View style={styles.bottomPanel} pointerEvents="box-none">
          <View
            accessibilityRole="alert"
            style={[
              styles.resultCard,
              processing
                ? styles.resultProcessing
                : success && status === 'late'
                  ? styles.resultLate
                  : success
                    ? styles.resultPresent
                    : styles.resultError,
            ]}
          >
            <View style={styles.resultIcon}>
              <Ionicons
                name={
                  processing
                    ? APP_ICONS.clock
                    : success
                      ? STATUS_META[status ?? 'present'].icon
                      : 'alert-circle'
                }
                size={24}
                color={
                  processing
                    ? COLORS.primary
                    : success
                      ? STATUS_META[status ?? 'present'].color
                      : COLORS.danger
                }
              />
            </View>
            <View style={styles.resultCopy}>
              <Text style={styles.resultTitle}>
                {processing
                  ? 'Recording attendance'
                  : success && status === 'late'
                    ? 'Marked late'
                    : success
                      ? 'Present'
                      : eventTitle || 'Could not record attendance'}
              </Text>
              <Text style={styles.resultMessage}>
                {processing ? 'Please wait.' : message || 'Try another QR.'}
              </Text>
            </View>
            {success && status ? (
              <View style={styles.resultChip}>
                <StatusChip status={status} />
              </View>
            ) : null}
            <AppButton
              theme="primary"
              title="Scan again"
              icon={APP_ICONS.retry}
              onPress={handleScanAgain}
              loading={processing}
              disabled={processing}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

type StatusScreenProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  loading?: boolean;
  children?: ReactNode;
};

function StatusScreen({
  icon,
  title,
  description,
  loading = false,
  children,
}: StatusScreenProps) {
  return (
    <SafeAreaView style={styles.statusScreen} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.statusContent}>
        <View style={styles.statusIcon}>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : (
            <Ionicons name={icon ?? 'information-circle-outline'} size={38} color={COLORS.primary} />
          )}
        </View>
        <Text style={styles.statusTitle}>{title}</Text>
        {description ? <Text style={styles.statusDescription}>{description}</Text> : null}
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  statusScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  statusContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  statusIcon: {
    width: 82,
    height: 82,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  statusDescription: {
    maxWidth: 330,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  scanner: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  scannerTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    backgroundColor: COLORS.overlay,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.overlay,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  topCopy: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textOnPrimary,
    marginLeft: 9,
  },
  topAction: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topActionPressed: {
    opacity: 0.7,
  },
  guide: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    bottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderColor: COLORS.textOnPrimary,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 28,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 28,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 28,
  },
  cornerBottomRight: {
    right: 0,
    bottom: 0,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderBottomRightRadius: 28,
  },
  guideCopy: {
    backgroundColor: COLORS.overlay,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginTop: 18,
  },
  guideText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textOnPrimary,
    textAlign: 'center',
  },
  bottomPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 17,
    paddingBottom: 12,
  },
  resultCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  resultProcessing: {
    borderColor: COLORS.primary,
  },
  resultPresent: {
    borderColor: COLORS.present,
  },
  resultLate: {
    borderColor: COLORS.late,
  },
  resultError: {
    borderColor: COLORS.danger,
  },
  resultIcon: {
    alignSelf: 'center',
    marginBottom: 7,
  },
  resultCopy: {
    alignItems: 'center',
    marginBottom: 13,
  },
  resultChip: {
    alignItems: 'center',
    marginBottom: 13,
  },
  resultTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  resultMessage: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});
