import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getDb } from '../../src/db/client';
import { colors, fonts, spacing, radius } from '../../src/constants/theme';
import { formatRupiah } from '../../src/utils/format';

export default function AdminDashboardScreen() {
  const [stats, setStats] = useState({ produk: 0, pesananMenunggu: 0, omzetBulanIni: 0 });

  const loadStats = useCallback(async () => {
    const db = await getDb();
    const produk = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM products WHERE is_active = 1'
    );
    const pesananMenunggu = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM orders WHERE status = 'menunggu_verifikasi'"
    );
    const omzet = await db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(total), 0) as total FROM orders
       WHERE status NOT IN ('menunggu_verifikasi','ditolak','dibatalkan')
       AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`
    );
    setStats({
      produk: produk?.count ?? 0,
      pesananMenunggu: pesananMenunggu?.count ?? 0,
      omzetBulanIni: omzet?.total ?? 0,
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Ringkasan toko Tas Kita</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.produk}</Text>
          <Text style={styles.statLabel}>Produk aktif</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.pesananMenunggu}</Text>
          <Text style={styles.statLabel}>Menunggu verifikasi</Text>
        </View>
      </View>

      <View style={styles.omzetCard}>
        <Text style={styles.omzetLabel}>Omzet bulan ini</Text>
        <Text style={styles.omzetValue}>{formatRupiah(stats.omzetBulanIni)}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.primary },
  subtitle: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, marginBottom: spacing.lg },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: { fontFamily: fonts.display, fontSize: 24, color: colors.textPrimary },
  statLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  omzetCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  omzetLabel: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.background },
  omzetValue: { fontFamily: fonts.display, fontSize: 26, color: colors.white, marginTop: 4 },
});
