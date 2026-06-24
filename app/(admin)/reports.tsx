import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, FlatList,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getDb } from '../../src/db/client';
import { colors, fonts, spacing, radius } from '../../src/constants/theme';
import { formatRupiah, formatDate } from '../../src/utils/format';

type Period = 'harian' | 'bulanan' | 'tahunan';

interface SummaryStats {
  totalOmzet: number;
  totalOrder: number;
  rataPerOrder: number;
  orderSelesai: number;
  orderDitolak: number;
}

interface PeriodRow {
  label: string;
  total: number;
  count: number;
}

interface TopProduct {
  product_name: string;
  total_qty: number;
  total_revenue: number;
}

interface RecentOrder {
  id: number;
  created_at: string;
  total: number;
  status: string;
  customer_name: string | null;
}

const STATUS_COLOR: Record<string, string> = {
  selesai: colors.success,
  dibayar: colors.accent,
  diproses: colors.primary,
  dikirim: colors.primary,
  menunggu_verifikasi: '#D9A441',
  ditolak: colors.danger,
  dibatalkan: colors.textMuted,
};

export default function ReportsScreen() {
  const [period, setPeriod] = useState<Period>('bulanan');
  const [stats, setStats] = useState<SummaryStats>({ totalOmzet: 0, totalOrder: 0, rataPerOrder: 0, orderSelesai: 0, orderDitolak: 0 });
  const [periodRows, setPeriodRows] = useState<PeriodRow[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  const loadData = useCallback(async () => {
    const db = await getDb();

    // Summary stats - semua order yang sudah terbayar
    const s = await db.getFirstAsync<{
      total_omzet: number; total_order: number; order_selesai: number; order_ditolak: number;
    }>(`
      SELECT
        COALESCE(SUM(CASE WHEN status NOT IN ('menunggu_verifikasi','ditolak','dibatalkan') THEN total ELSE 0 END), 0) as total_omzet,
        COUNT(*) as total_order,
        SUM(CASE WHEN status = 'selesai' THEN 1 ELSE 0 END) as order_selesai,
        SUM(CASE WHEN status IN ('ditolak','dibatalkan') THEN 1 ELSE 0 END) as order_ditolak
      FROM orders
    `);

    const totalOmzet = s?.total_omzet ?? 0;
    const totalOrder = s?.total_order ?? 0;
    setStats({
      totalOmzet,
      totalOrder,
      rataPerOrder: totalOrder > 0 ? totalOmzet / totalOrder : 0,
      orderSelesai: s?.order_selesai ?? 0,
      orderDitolak: s?.order_ditolak ?? 0,
    });

    // Data per periode
    let groupSql = '';
    let labelExpr = '';
    if (period === 'harian') {
      groupSql = `strftime('%Y-%m-%d', created_at)`;
      labelExpr = `strftime('%d %b', created_at)`;
    } else if (period === 'bulanan') {
      groupSql = `strftime('%Y-%m', created_at)`;
      labelExpr = `strftime('%b %Y', created_at)`;
    } else {
      groupSql = `strftime('%Y', created_at)`;
      labelExpr = `strftime('%Y', created_at)`;
    }

    const rows = await db.getAllAsync<{ label: string; total: number; count: number }>(`
      SELECT ${labelExpr} as label,
             COALESCE(SUM(total), 0) as total,
             COUNT(*) as count
      FROM orders
      WHERE status NOT IN ('menunggu_verifikasi','ditolak','dibatalkan')
      GROUP BY ${groupSql}
      ORDER BY ${groupSql} DESC
      LIMIT 12
    `);
    setPeriodRows(rows);

    // Produk terlaris
    const top = await db.getAllAsync<TopProduct>(`
      SELECT oi.product_name,
             SUM(oi.qty) as total_qty,
             SUM(oi.qty * oi.price) as total_revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status NOT IN ('menunggu_verifikasi','ditolak','dibatalkan')
      GROUP BY oi.product_name
      ORDER BY total_qty DESC
      LIMIT 5
    `);
    setTopProducts(top);

    // Transaksi terbaru
    const recent = await db.getAllAsync<RecentOrder>(`
      SELECT o.id, o.created_at, o.total, o.status, u.name as customer_name
      FROM orders o
      LEFT JOIN users u ON u.id = o.customer_id
      ORDER BY o.created_at DESC
      LIMIT 10
    `);
    setRecentOrders(recent);
  }, [period]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const maxTotal = periodRows.length > 0 ? Math.max(...periodRows.map(r => r.total)) : 1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Laporan Keuangan</Text>

      {/* Kartu ringkasan */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.statCardPrimary]}>
          <Text style={styles.statLabelLight}>Total omzet</Text>
          <Text style={styles.statValueLarge}>{formatRupiah(stats.totalOmzet)}</Text>
        </View>
        <View style={styles.statRow}>
          <View style={styles.statCardSmall}>
            <Ionicons name="receipt-outline" size={20} color={colors.primary} />
            <Text style={styles.statValueSmall}>{stats.totalOrder}</Text>
            <Text style={styles.statLabelSmall}>Total pesanan</Text>
          </View>
          <View style={styles.statCardSmall}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
            <Text style={styles.statValueSmall}>{stats.orderSelesai}</Text>
            <Text style={styles.statLabelSmall}>Selesai</Text>
          </View>
          <View style={styles.statCardSmall}>
            <Ionicons name="close-circle-outline" size={20} color={colors.danger} />
            <Text style={styles.statValueSmall}>{stats.orderDitolak}</Text>
            <Text style={styles.statLabelSmall}>Ditolak</Text>
          </View>
        </View>
        <View style={styles.statCardWide}>
          <Text style={styles.statLabelSmall}>Rata-rata per pesanan</Text>
          <Text style={styles.statValueMedium}>{formatRupiah(stats.rataPerOrder)}</Text>
        </View>
      </View>

      {/* Filter periode */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Grafik omzet</Text>
        <View style={styles.periodTabs}>
          {(['harian', 'bulanan', 'tahunan'] as Period[]).map(p => (
            <Pressable
              key={p}
              style={[styles.periodTab, period === p && styles.periodTabActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodTabText, period === p && styles.periodTabTextActive]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Bar chart manual */}
      <View style={styles.chartCard}>
        {periodRows.length === 0 ? (
          <Text style={styles.emptyChart}>Belum ada data penjualan</Text>
        ) : (
          periodRows.map((row, idx) => (
            <View key={idx} style={styles.barRow}>
              <Text style={styles.barLabel} numberOfLines={1}>{row.label}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${Math.max(4, (row.total / maxTotal) * 100)}%` }]} />
              </View>
              <Text style={styles.barValue}>{formatRupiah(row.total)}</Text>
            </View>
          ))
        )}
      </View>

      {/* Produk terlaris */}
      <Text style={styles.sectionTitle}>Produk terlaris</Text>
      <View style={styles.card}>
        {topProducts.length === 0 ? (
          <Text style={styles.emptyText}>Belum ada data</Text>
        ) : (
          topProducts.map((p, idx) => (
            <View key={idx} style={[styles.topRow, idx < topProducts.length - 1 && styles.topRowBorder]}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{idx + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.topName} numberOfLines={1}>{p.product_name}</Text>
                <Text style={styles.topSub}>{p.total_qty} pcs terjual</Text>
              </View>
              <Text style={styles.topRevenue}>{formatRupiah(p.total_revenue)}</Text>
            </View>
          ))
        )}
      </View>

      {/* Transaksi terbaru */}
      <Text style={styles.sectionTitle}>Transaksi terbaru</Text>
      <View style={styles.card}>
        {recentOrders.length === 0 ? (
          <Text style={styles.emptyText}>Belum ada transaksi</Text>
        ) : (
          recentOrders.map((o, idx) => (
            <View key={o.id} style={[styles.txRow, idx < recentOrders.length - 1 && styles.txRowBorder]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.txId}>#{o.id} · {o.customer_name ?? 'Offline'}</Text>
                <Text style={styles.txDate}>{formatDate(o.created_at)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.txTotal}>{formatRupiah(o.total)}</Text>
                <View style={[styles.txStatus, { backgroundColor: (STATUS_COLOR[o.status] ?? colors.textMuted) + '25' }]}>
                  <Text style={[styles.txStatusText, { color: STATUS_COLOR[o.status] ?? colors.textMuted }]}>
                    {o.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  heading: { fontFamily: fonts.display, fontSize: 22, color: colors.primary, marginBottom: spacing.md },
  statsGrid: { gap: spacing.sm, marginBottom: spacing.md },
  statCardPrimary: { backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md },
  statLabelLight: { fontFamily: fonts.body, fontSize: 12, color: colors.background },
  statValueLarge: { fontFamily: fonts.display, fontSize: 26, color: colors.white, marginTop: 2 },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  statCardSmall: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, alignItems: 'center' },
  statValueSmall: { fontFamily: fonts.display, fontSize: 20, color: colors.textPrimary, marginTop: 2 },
  statLabelSmall: { fontFamily: fonts.body, fontSize: 10, color: colors.textMuted, textAlign: 'center', marginTop: 2 },
  statCardWide: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  statValueMedium: { fontFamily: fonts.display, fontSize: 18, color: colors.primary, marginTop: 2 },
  statCard: {},
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm, marginTop: spacing.sm },
  sectionTitle: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textPrimary, marginBottom: spacing.sm, marginTop: spacing.sm },
  periodTabs: { flexDirection: 'row', gap: spacing.xs },
  periodTab: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  periodTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  periodTabText: { fontFamily: fonts.body, fontSize: 11, color: colors.textSecondary },
  periodTabTextActive: { color: colors.white },
  chartCard: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  emptyChart: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  barLabel: { width: 64, fontFamily: fonts.body, fontSize: 10, color: colors.textMuted },
  barTrack: { flex: 1, height: 16, backgroundColor: colors.background, borderRadius: 8, overflow: 'hidden', marginHorizontal: spacing.xs },
  barFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 8 },
  barValue: { width: 80, fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.textPrimary, textAlign: 'right' },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  emptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.sm },
  topRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rankBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center' },
  rankText: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.primary },
  topName: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textPrimary },
  topSub: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted },
  topRevenue: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.primary },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  txRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  txId: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textPrimary },
  txDate: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted, marginTop: 1 },
  txTotal: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.primary },
  txStatus: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, marginTop: 2 },
  txStatusText: { fontFamily: fonts.body, fontSize: 10 },
});
