import { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Image, Alert, ScrollView, Modal } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getDb } from '../../src/db/client';
import { useAuth } from '../../src/context/AuthContext';
import { colors, fonts, spacing, radius } from '../../src/constants/theme';
import { formatRupiah, formatDateTime } from '../../src/utils/format';

interface PendingOrder {
  order_id: number;
  total: number;
  alamat_pengiriman: string | null;
  created_at: string;
  customer_name: string;
  bukti_transfer_uri: string | null;
  payment_id: number;
}

export default function VerifyPaymentsScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [selected, setSelected] = useState<PendingOrder | null>(null);
  const [processing, setProcessing] = useState(false);

  const loadOrders = useCallback(async () => {
    const db = await getDb();
    const rows = await db.getAllAsync<PendingOrder>(`
      SELECT o.id as order_id, o.total, o.alamat_pengiriman, o.created_at,
             u.name as customer_name,
             p.bukti_transfer_uri, p.id as payment_id
      FROM orders o
      JOIN payments p ON p.order_id = o.id
      LEFT JOIN users u ON u.id = o.customer_id
      WHERE o.status = 'menunggu_verifikasi'
      ORDER BY o.created_at ASC
    `);
    setOrders(rows);
  }, []);

  useFocusEffect(useCallback(() => { loadOrders(); }, [loadOrders]));

  async function handleVerify(order: PendingOrder, approve: boolean) {
    Alert.alert(
      approve ? 'Verifikasi pesanan?' : 'Tolak pesanan?',
      approve
        ? `Konfirmasi pembayaran pesanan #${order.order_id} dan kurangi stok produk.`
        : `Tolak pesanan #${order.order_id}. Stok tidak akan berkurang.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: approve ? 'Verifikasi' : 'Tolak',
          style: approve ? 'default' : 'destructive',
          onPress: async () => {
            setProcessing(true);
            const db = await getDb();
            const newStatus = approve ? 'dibayar' : 'ditolak';
            const paymentStatus = approve ? 'verified' : 'rejected';

            await db.runAsync(
              `UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?`,
              [newStatus, order.order_id]
            );
            await db.runAsync(
              `UPDATE payments SET status = ?, verified_by = ?, verified_at = datetime('now') WHERE id = ?`,
              [paymentStatus, user!.id, order.payment_id]
            );

            if (approve) {
              // Kurangi stok & catat stock movement
              const items = await db.getAllAsync<{ product_id: number; qty: number }>(
                'SELECT product_id, qty FROM order_items WHERE order_id = ?',
                [order.order_id]
              );
              for (const item of items) {
                await db.runAsync(
                  'UPDATE products SET stock = stock - ? WHERE id = ?',
                  [item.qty, item.product_id]
                );
                await db.runAsync(
                  `INSERT INTO stock_movements (product_id, type, qty, source, note) VALUES (?, 'keluar', ?, 'order', ?)`,
                  [item.product_id, item.qty, `Order #${order.order_id}`]
                );
              }
            }

            setProcessing(false);
            setSelected(null);
            loadOrders();
            Alert.alert(approve ? 'Pesanan diverifikasi!' : 'Pesanan ditolak.');
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.order_id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={64} color={colors.success} />
            <Text style={styles.emptyTitle}>Semua beres!</Text>
            <Text style={styles.emptyText}>Tidak ada pesanan yang menunggu verifikasi.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => setSelected(item)}>
            <View style={styles.cardHeader}>
              <Text style={styles.orderId}>Pesanan #{item.order_id}</Text>
              <Text style={styles.orderDate}>{formatDateTime(item.created_at)}</Text>
            </View>
            <Text style={styles.customerName}>👤 {item.customer_name ?? 'Customer'}</Text>
            <Text style={styles.orderTotal}>{formatRupiah(item.total)}</Text>
            {item.bukti_transfer_uri ? (
              <Text style={styles.hasBukti}>📎 Bukti transfer tersedia</Text>
            ) : (
              <Text style={styles.noBukti}>⚠️ Belum ada bukti transfer</Text>
            )}
            <Text style={styles.tapHint}>Ketuk untuk verifikasi →</Text>
          </Pressable>
        )}
      />

      {/* Modal detail & verifikasi */}
      <Modal visible={!!selected} animationType="slide" onRequestClose={() => setSelected(null)}>
        {selected && (
          <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
            <Pressable style={styles.closeBtn} onPress={() => setSelected(null)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.modalTitle}>Pesanan #{selected.order_id}</Text>
            <Text style={styles.modalSub}>{selected.customer_name ?? 'Customer'} · {formatDateTime(selected.created_at)}</Text>
            <Text style={styles.modalTotal}>{formatRupiah(selected.total)}</Text>
            {selected.alamat_pengiriman && (
              <>
                <Text style={styles.modalLabel}>Alamat</Text>
                <Text style={styles.modalValue}>{selected.alamat_pengiriman}</Text>
              </>
            )}
            <Text style={styles.modalLabel}>Bukti Transfer</Text>
            {selected.bukti_transfer_uri ? (
              <Image source={{ uri: selected.bukti_transfer_uri }} style={styles.buktiImage} resizeMode="contain" />
            ) : (
              <Text style={styles.noBuktiModal}>Belum ada bukti transfer diupload.</Text>
            )}

            <View style={styles.actionRow}>
              <Pressable
                style={[styles.rejectBtn, processing && { opacity: 0.5 }]}
                onPress={() => handleVerify(selected, false)}
                disabled={processing}
              >
                <Ionicons name="close-circle-outline" size={20} color={colors.danger} />
                <Text style={styles.rejectBtnText}>Tolak</Text>
              </Pressable>
              <Pressable
                style={[styles.approveBtn, processing && { opacity: 0.5 }]}
                onPress={() => handleVerify(selected, true)}
                disabled={processing}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />
                <Text style={styles.approveBtnText}>Verifikasi</Text>
              </Pressable>
            </View>
          </ScrollView>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary },
  orderDate: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted },
  customerName: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  orderTotal: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.primary, marginTop: 4 },
  hasBukti: { fontFamily: fonts.body, fontSize: 12, color: colors.success, marginTop: 4 },
  noBukti: { fontFamily: fonts.body, fontSize: 12, color: colors.warning, marginTop: 4 },
  tapHint: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted, marginTop: 4 },
  empty: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, marginTop: spacing.xl },
  emptyTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.textPrimary, marginTop: spacing.md },
  emptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
  modal: { flex: 1, backgroundColor: colors.background },
  modalContent: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  closeBtn: { alignSelf: 'flex-end', padding: spacing.xs },
  modalTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.textPrimary },
  modalSub: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  modalTotal: { fontFamily: fonts.bodySemiBold, fontSize: 20, color: colors.primary, marginTop: spacing.sm },
  modalLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textPrimary, marginTop: spacing.lg },
  modalValue: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 20 },
  buktiImage: { width: '100%', height: 300, borderRadius: radius.md, marginTop: spacing.sm, backgroundColor: colors.background },
  noBuktiModal: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, marginTop: spacing.sm },
  actionRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.danger, borderRadius: radius.sm, paddingVertical: spacing.md, gap: spacing.xs },
  rejectBtnText: { fontFamily: fonts.bodySemiBold, color: colors.danger, fontSize: 15 },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.success, borderRadius: radius.sm, paddingVertical: spacing.md, gap: spacing.xs },
  approveBtnText: { fontFamily: fonts.bodySemiBold, color: colors.white, fontSize: 15 },
});
