import { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable, ScrollView,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useCart } from '../../src/context/CartContext';
import { useAuth } from '../../src/context/AuthContext';
import { getDb } from '../../src/db/client';
import { colors, fonts, spacing, radius } from '../../src/constants/theme';
import { formatRupiah } from '../../src/utils/format';

// Info rekening toko
const REKENING = { bank: 'BCA', noRek: '1234567890', atas: 'Tas Kita Store' };

export default function CheckoutScreen() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [alamat, setAlamat] = useState('');
  const [catatan, setCatatan] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleOrder() {
    if (!alamat.trim()) { Alert.alert('Alamat wajib diisi'); return; }
    if (items.length === 0) { Alert.alert('Keranjang kosong'); return; }

    setLoading(true);
    const db = await getDb();

    try {
      // Cek stok ulang sebelum buat order
      for (const item of items) {
        const prod = await db.getFirstAsync<{ stock: number }>(
          'SELECT stock FROM products WHERE id = ?', [item.product.id]
        );
        if (!prod || prod.stock < item.qty) {
          Alert.alert('Stok tidak cukup', `${item.product.name} stok tersisa ${prod?.stock ?? 0}`);
          setLoading(false);
          return;
        }
      }

      // Buat order
      const orderResult = await db.runAsync(
        `INSERT INTO orders (customer_id, sale_channel, status, total, alamat_pengiriman, catatan)
         VALUES (?, 'online', 'menunggu_verifikasi', ?, ?, ?)`,
        [user!.id, totalPrice, alamat.trim(), catatan.trim() || null]
      );
      const orderId = orderResult.lastInsertRowId;

      // Insert order items
      for (const item of items) {
        await db.runAsync(
          `INSERT INTO order_items (order_id, product_id, product_name, qty, price)
           VALUES (?, ?, ?, ?, ?)`,
          [orderId, item.product.id, item.product.name, item.qty, item.product.price]
        );
      }

      // Buat payment record
      await db.runAsync(
        `INSERT INTO payments (order_id, status) VALUES (?, 'pending')`,
        [orderId]
      );

      clearCart();
      router.replace({ pathname: '/(customer)/upload-payment', params: { orderId: String(orderId) } });
    } catch (e) {
      Alert.alert('Gagal membuat pesanan', 'Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Checkout</Text>

        {/* Ringkasan pesanan */}
        <Text style={styles.sectionTitle}>Ringkasan pesanan</Text>
        <View style={styles.card}>
          {items.map(item => (
            <View key={item.product.id} style={styles.itemRow}>
              <Text style={styles.itemName} numberOfLines={1}>{item.product.name}</Text>
              <Text style={styles.itemQty}>x{item.qty}</Text>
              <Text style={styles.itemPrice}>{formatRupiah(item.product.price * item.qty)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.itemRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>{formatRupiah(totalPrice)}</Text>
          </View>
        </View>

        {/* Info pembayaran */}
        <Text style={styles.sectionTitle}>Pembayaran via transfer</Text>
        <View style={styles.card}>
          <Text style={styles.bankLabel}>Bank {REKENING.bank}</Text>
          <Text style={styles.rekening}>{REKENING.noRek}</Text>
          <Text style={styles.atasNama}>a.n. {REKENING.atas}</Text>
          <Text style={styles.transferNote}>
            Transfer tepat sebesar {formatRupiah(totalPrice)} lalu upload bukti transfer di langkah berikutnya.
          </Text>
        </View>

        {/* Alamat */}
        <Text style={styles.sectionTitle}>Alamat pengiriman *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={alamat}
          onChangeText={setAlamat}
          placeholder="Jl. Contoh No. 1, Kelurahan, Kecamatan, Kota..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.sectionTitle}>Catatan (opsional)</Text>
        <TextInput
          style={styles.input}
          value={catatan}
          onChangeText={setCatatan}
          placeholder="Warna, ukuran, atau pesan lainnya..."
          placeholderTextColor={colors.textMuted}
        />

        <Pressable style={styles.orderBtn} onPress={handleOrder} disabled={loading}>
          <Text style={styles.orderBtnText}>{loading ? 'Memproses...' : 'Buat pesanan'}</Text>
        </Pressable>

        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Kembali ke keranjang</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  heading: { fontFamily: fonts.display, fontSize: 24, color: colors.primary, marginBottom: spacing.lg },
  sectionTitle: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textPrimary, marginBottom: spacing.sm, marginTop: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  itemName: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.textPrimary },
  itemQty: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, marginHorizontal: spacing.sm },
  itemPrice: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  totalLabel: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary },
  totalPrice: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.primary },
  bankLabel: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary },
  rekening: { fontFamily: fonts.display, fontSize: 22, color: colors.primary, marginTop: 2 },
  atasNama: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  transferNote: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 18 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, fontFamily: fonts.body, fontSize: 14, color: colors.textPrimary, backgroundColor: colors.surface },
  textArea: { height: 80, textAlignVertical: 'top' },
  orderBtn: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.xl },
  orderBtnText: { fontFamily: fonts.bodySemiBold, color: colors.white, fontSize: 15 },
  backBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  backBtnText: { fontFamily: fonts.bodyMedium, color: colors.textSecondary, fontSize: 14 },
});
