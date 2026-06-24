import { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getDb } from '../../src/db/client';
import { useAuth } from '../../src/context/AuthContext';
import { colors, fonts, spacing, radius } from '../../src/constants/theme';
import { formatRupiah, formatDateTime } from '../../src/utils/format';
import type { Order } from '../../src/types';

const STATUS_LABEL: Record<string, string> = {
  menunggu_verifikasi: 'Menunggu verifikasi',
  dibayar: 'Dibayar',
  diproses: 'Diproses',
  dikirim: 'Dikirim',
  selesai: 'Selesai',
  ditolak: 'Ditolak',
  dibatalkan: 'Dibatalkan',
};

const STATUS_COLOR: Record<string, string> = {
  menunggu_verifikasi: colors.warning,
  dibayar: colors.accent,
  diproses: colors.primary,
  dikirim: colors.primary,
  selesai: colors.success,
  ditolak: colors.danger,
  dibatalkan: colors.textMuted,
};

export default function CustomerOrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  const loadOrders = useCallback(async () => {
    const db = await getDb();
    const rows = await db.getAllAsync<Order>(
      'SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC',
      [user!.id]
    );
    setOrders(rows);
  }, [user]);

  useFocusEffect(useCallback(() => { loadOrders(); }, [loadOrders]));

  if (orders.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="receipt-outline" size={64} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>Belum ada pesanan</Text>
        <Text style={styles.emptyText}>Mulai belanja dan pesananmu akan muncul di sini.</Text>
        <Pressable style={styles.shopBtn} onPress={() => router.push('/(customer)')}>
          <Text style={styles.shopBtnText}>Belanja sekarang</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Pesanan saya</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push({ pathname: '/(customer)/order-detail', params: { orderId: String(item.id) } })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.orderId}>Pesanan #{item.id}</Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[item.status] + '20' }]}>
                <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] }]}>
                  {STATUS_LABEL[item.status]}
                </Text>
              </View>
            </View>
            <Text style={styles.orderDate}>{formatDateTime(item.created_at)}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.orderTotal}>{formatRupiah(item.total)}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  heading: { fontFamily: fonts.display, fontSize: 22, color: colors.primary, padding: spacing.lg, paddingBottom: spacing.sm },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textPrimary },
  statusBadge: { borderRadius: 20, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  statusText: { fontFamily: fonts.bodyMedium, fontSize: 11 },
  orderDate: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted, marginTop: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  orderTotal: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.primary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.textPrimary, marginTop: spacing.md },
  emptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
  shopBtn: { marginTop: spacing.lg, backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.xl },
  shopBtnText: { fontFamily: fonts.bodySemiBold, color: colors.white, fontSize: 14 },
});
