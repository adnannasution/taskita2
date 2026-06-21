import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '../../src/constants/theme';

export default function VerifyPaymentsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verifikasi pembayaran</Text>
      <Text style={styles.text}>
        Daftar bukti transfer yang menunggu verifikasi akan dibangun di tahap berikutnya.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.primary, marginBottom: spacing.sm },
  text: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
});
