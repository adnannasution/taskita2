import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '../../src/constants/theme';

export default function CustomerOrdersScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pesanan saya</Text>
      <Text style={styles.text}>Riwayat & status pesanan akan tampil di sini setelah fitur checkout dibangun.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.primary, marginBottom: spacing.sm },
  text: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
});
