import { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, Pressable, Modal,
  ScrollView, Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getDb } from '../../src/db/client';
import { colors, fonts, spacing, radius } from '../../src/constants/theme';
import { formatRupiah, formatDateTime } from '../../src/utils/format';

interface OrderRow {
  id: number;
  status: string;
  total: number;
  alamat_pengiriman: string | null;
  catatan: string | null;
  sale_channel: string;
  created_at: string;
  customer_name: string | null;
  customer_username: string | null;
}

interface OrderItem {
  product_name: string;
  qty: number;
  price: number;
}

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
  menunggu_verifikasi: '#D9A441',
  dibayar: '#C9A227',
  diproses: '#A85C32',
  dikirim: '#A85C32',
  selesai: '#4F7942',
  ditolak: '#B5453B',
  dibatalkan: '#A89E92',
};

const FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'menunggu_verifikasi', label: 'Menunggu' },
  { key: 'dibayar', label: 'Dibayar' },
  { key: 'diproses', label: 'Diproses' },
  { key: 'dikirim', label: 'Dikirim' },
  { key: 'selesai', label: 'Selesai' },
  { key: 'ditolak', label: 'Ditolak' },
];

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<OrderRow | null>(null);
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadOrders = useCallback(async () => {
    const db = await getDb();
    const where = filter === 'all' ? '' : `WHERE o.status = '${filter}'`;
    const rows = await db.getAllAsync<OrderRow>(`
      SELECT o.id, o.status, o.total, o.alamat_pengiriman, o.catatan,
             o.sale_channel, o.created_at,
             u.name as customer_name, u.username as customer_username
      FROM orders o
      LEFT JOIN users u ON u.id = o.customer_id
      ${where}
      ORDER BY o.created_at DESC
    `);
    setOrders(rows);
  }, [filter]);

  useFocusEffect(useCallback(() => { loadOrders(); }, [loadOrders]));

  async function openDetail(order: OrderRow) {
    const db = await getDb();
    const items = await db.getAllAsync<OrderItem>(
      'SELECT product_name, qty, price FROM order_items WHERE order_id = ?',
      [order.id]
    );
    setSelectedItems(items);
    setSelected(order);
  }

  async function updateStatus(order: OrderRow, newStatus: string) {
    Alert.alert(
      'Update status?',
      `Ubah status pesanan #${order.id} menjadi "${STATUS_LABEL[newStatus]}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya', onPress: async () => {
            setUpdatingStatus(true);
            const db = await getDb();
            await db.runAsync(
              `UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?`,
              [newStatus, order.id]
            );
            setUpdatingStatus(false);
            setSelected(null);
            loadOrders();
          },
        },
      ]
    );
  }

  const nextStatuses: Record<string, string[]> = {
    dibayar: ['diproses'],
    diproses: ['dikirim'],
    dikirim: ['selesai'],
  };

  return (
    <View style={styles.container}>
      {/* Filter pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterContent}>
        {FILTERS.map(f => (
          <Pressable
            key={f.key}
            style={[styles.filterPill, filter === f.key && styles.filterPillActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>Belum ada pesanan</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => openDetail(item)}>
            <View style={styles.cardHeader}>
              <Text style={styles.orderId}>#{item.id} · {item.sale_channel === 'offline' ? '🏪 Offline' : '📱 Online'}</Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[item.status] + '25' }]}>
                <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] }]}>
                  {STATUS_LABEL[item.status] ?? item.status}
                </Text>
              </View>
            </View>
            <Text style={styles.customerName}>
              👤 {item.customer_name ?? 'Offline / Manual'}
            </Text>
            <Text style={styles.orderDate}>{formatDateTime(item.created_at)}</Text>
            {item.alamat_pengiriman && (
              <Text style={styles.alamat} numberOfLines={1}>
                📍 {item.alamat_pengiriman}
              </Text>
            )}
            <View style={styles.cardFooter}>
              <Text style={styles.orderTotal}>{formatRupiah(item.total)}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
          </Pressable>
        )}
      />

      {/* Modal detail pesanan */}
      <Modal visible={!!selected} animationType="slide" onRequestClose={() => setSelected(null)}>
        {selected && (
          <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
            <Pressable style={styles.closeBtn} onPress={() => setSelected(null)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>

            <Text style={styles.modalTitle}>Pesanan #{selected.id}</Text>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[selected.status] + '25', alignSelf: 'flex-start', marginTop: spacing.xs }]}>
              <Text style={[styles.statusText, { color: STATUS_COLOR[selected.status] }]}>
                {STATUS_LABEL[selected.status]}
              </Text>
            </View>
            <Text style={styles.modalDate}>{formatDateTime(selected.created_at)}</Text>

            {/* Info customer */}
            <Text style={styles.modalSection}>👤 Customer</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>{selected.customer_name ?? 'Offline / Input manual'}</Text>
              {selected.customer_username && (
                <Text style={styles.infoSub}>@{selected.customer_username}</Text>
              )}
            </View>

            {/* Alamat pengiriman */}
            {selected.alamat_pengiriman && (
              <>
                <Text style={styles.modalSection}>📍 Alamat pengiriman</Text>
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>{selected.alamat_pengiriman}</Text>
                  {selected.catatan && (
                    <Text style={styles.infoSub}>Catatan: {selected.catatan}</Text>
                  )}
                </View>
              </>
            )}

            {/* Item pesanan */}
            <Text style={styles.modalSection}>🛍️ Item pesanan</Text>
            <View style={styles.infoBox}>
              {selectedItems.map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.product_name}</Text>
                  <Text style={styles.itemQty}>x{item.qty}</Text>
                  <Text style={styles.itemPrice}>{formatRupiah(item.price * item.qty)}</Text>
                </View>
              ))}
              <View style={styles.divider} />
              <View style={styles.itemRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalPrice}>{formatRupiah(selected.total)}</Text>
              </View>
            </View>

            {/* Update status */}
            {nextStatuses[selected.status] && (
              <>
                <Text style={styles.modalSection}>🔄 Update status</Text>
                <View style={styles.actionRow}>
                  {nextStatuses[selected.status].map(s => (
                    <Pressable
                      key={s}
                      style={[styles.statusBtn, { backgroundColor: STATUS_COLOR[s] }]}
                      onPress={() => updateStatus(selected, s)}
                      disabled={updatingStatus}
                    >
                      <Text style={styles.statusBtnText}>
                        {updatingStatus ? 'Memproses...' : `Tandai: ${STATUS_LABEL[s]}`}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filterBar: { maxHeight: 48, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterContent: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  filterPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  filterPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSecondary },
  filterTextActive: { color: colors.white },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textPrimary },
  statusBadge: { borderRadius: 20, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  statusText: { fontFamily: fonts.bodyMedium, fontSize: 11 },
  customerName: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  orderDate: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted, marginTop: 2 },
  alamat: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  orderTotal: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.primary },
  empty: { alignItems: 'center', paddingTop: spacing.xl * 2 },
  emptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, marginTop: spacing.md },
  modal: { flex: 1, backgroundColor: colors.background },
  modalContent: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  closeBtn: { alignSelf: 'flex-end' },
  modalTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.textPrimary },
  modalDate: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 4, marginBottom: spacing.sm },
  modalSection: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.xs },
  infoBox: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  infoText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textPrimary },
  infoSub: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  itemName: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.textPrimary },
  itemQty: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, marginHorizontal: spacing.sm },
  itemPrice: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  totalLabel: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary },
  totalPrice: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.primary },
  actionRow: { gap: spacing.sm },
  statusBtn: { borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center' },
  statusBtnText: { fontFamily: fonts.bodySemiBold, color: colors.white, fontSize: 14 },
});
