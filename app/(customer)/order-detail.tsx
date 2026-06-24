import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { useLocalSearchParams, useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getDb } from '../../src/db/client';
import { colors, fonts, spacing, radius } from '../../src/constants/theme';
import { formatRupiah, formatDateTime } from '../../src/utils/format';
import type { Order, OrderItem, Payment } from '../../src/types';

const STATUS_LABEL: Record<string, string> = {
  menunggu_verifikasi: 'Menunggu verifikasi',
  dibayar: 'Dibayar',
  diproses: 'Diproses',
  dikirim: 'Dikirim',
  selesai: 'Selesai',
  ditolak: 'Ditolak',
  dibatalkan: 'Dibatalkan',
};

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [payment, setPayment] = useState<Payment | null>(null);

  const loadData = useCallback(async () => {
    const db = await getDb();
    const o = await db.getFirstAsync<Order>('SELECT * FROM orders WHERE id = ?', [Number(orderId)]);
    const i = await db.getAllAsync<OrderItem>('SELECT * FROM order_items WHERE order_id = ?', [Number(orderId)]);
    const p = await db.getFirstAsync<Payment>('SELECT * FROM payments WHERE order_id = ?', [Number(orderId)]);
    setOrder(o ?? null);
    setItems(i);
    setPayment(p ?? null);
  }, [orderId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  if (!order) return <View style={styles.center}><Text>Memuat...</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
        <Text style={styles.backText}>Kembali</Text>
      </Pressable>

      <Text style={styles.heading}>Pesanan #{order.id}</Text>
      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>{STATUS_LABEL[order.status] ?? order.status}</Text>
      </View>
      <Text style={styles.date}>{formatDateTime(order.created_at)}</Text>

      <Text style={styles.sectionTitle}>Item pesanan</Text>
      <View style={styles.card}>
        {items.map(item => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemName} numberOfLines={1}>{item.product_name}</Text>
            <Text style={styles.itemQty}>x{item.qty}</Text>
            <Text style={styles.itemPrice}>{formatRupiah(item.price * item.qty)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.itemRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>{formatRupiah(order.total)}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Alamat pengiriman</Text>
      <View style={styles.card}>
        <Text style={styles.alamat}>{order.alamat_pengiriman ?? '-'}</Text>
        {order.catatan ? <Text style={styles.catatan}>Catatan: {order.catatan}</Text> : null}
      </View>

      <Text style={styles.sectionTitle}>Bukti transfer</Text>
      <View style={styles.card}>
        {payment?.bukti_transfer_uri ? (
          <>
            <Image source={{ uri: payment.bukti_transfer_uri }} style={styles.buktiPhoto} resizeMode="contain" />
            <Text style={styles.buktiStatus}>
              Status: {payment.status === 'verified' ? '✅ Terverifikasi' : payment.status === 'rejected' ? '❌ Ditolak' : '⏳ Menunggu verifikasi'}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.noBukti}>Bukti transfer belum diupload.</Text>
            <Pressable
              style={styles.uploadBtn}
              onPress={() => router.push({ pathname: '/(customer)/upload-payment', params: { orderId: String(order.id) } })}
            >
              <Text style={styles.uploadBtnText}>Upload sekarang</Text>
            </Pressable>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md },
  backText: { fontFamily: fonts.bodyMedium, color: colors.primary, fontSize: 14 },
  heading: { fontFamily: fonts.display, fontSize: 22, color: colors.textPrimary },
  statusBadge: { alignSelf: 'flex-start', backgroundColor: colors.primary + '20', borderRadius: 20, paddingHorizontal: spacing.sm, paddingVertical: 2, marginTop: spacing.xs },
  statusText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.primary },
  date: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 4, marginBottom: spacing.sm },
  sectionTitle: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textPrimary, marginTop: spacing.md, marginBottom: spacing.sm },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  itemName: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.textPrimary },
  itemQty: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, marginHorizontal: spacing.sm },
  itemPrice: { fontFamily: fonts.bodyMedium, fontSize: 13 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  totalLabel: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary },
  totalPrice: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.primary },
  alamat: { fontFamily: fonts.body, fontSize: 13, color: colors.textPrimary, lineHeight: 20 },
  catatan: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: spacing.sm },
  buktiPhoto: { width: '100%', height: 220, borderRadius: radius.sm },
  buktiStatus: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textPrimary, marginTop: spacing.sm, textAlign: 'center' },
  noBukti: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.md },
  uploadBtn: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: spacing.sm, alignItems: 'center' },
  uploadBtnText: { fontFamily: fonts.bodySemiBold, color: colors.white, fontSize: 14 },
});
