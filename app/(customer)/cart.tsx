import { View, Text, FlatList, StyleSheet, Pressable, Image, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../src/context/CartContext';
import { colors, fonts, spacing, radius } from '../../src/constants/theme';
import { formatRupiah } from '../../src/utils/format';

export default function CartScreen() {
  const { items, updateQty, removeItem, totalItems, totalPrice } = useCart();
  const insets = useSafeAreaInsets();

  function handleRemove(productId: number, name: string) {
    Alert.alert('Hapus item?', `Hapus "${name}" dari keranjang?`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => removeItem(productId) },
    ]);
  }

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="bag-outline" size={64} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>Keranjang kosong</Text>
        <Text style={styles.emptyText}>Tambahkan produk dari katalog dulu yuk!</Text>
        <Pressable style={styles.shopBtn} onPress={() => router.push('/(customer)')}>
          <Text style={styles.shopBtnText}>Belanja sekarang</Text>
        </Pressable>
      </View>
    );
  }

  const footerHeight = 72 + insets.bottom;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Keranjang ({totalItems} item)</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.product.id)}
        contentContainerStyle={[styles.list, { paddingBottom: footerHeight + spacing.md }]}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardImg}>
              {item.product.photo_uri ? (
                <Image source={{ uri: item.product.photo_uri }} style={styles.img} />
              ) : (
                <Ionicons name="bag-outline" size={28} color={colors.textMuted} />
              )}
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.productName} numberOfLines={2}>{item.product.name}</Text>
              <Text style={styles.productPrice}>{formatRupiah(item.product.price)}</Text>
              <View style={styles.qtyRow}>
                <Pressable style={styles.qtyBtn} onPress={() => updateQty(item.product.id, item.qty - 1)}>
                  <Ionicons name="remove" size={16} color={colors.primary} />
                </Pressable>
                <Text style={styles.qtyText}>{item.qty}</Text>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => {
                    if (item.qty >= item.product.stock) {
                      Alert.alert('Stok tidak cukup', `Maksimal ${item.product.stock} pcs`);
                      return;
                    }
                    updateQty(item.product.id, item.qty + 1);
                  }}
                >
                  <Ionicons name="add" size={16} color={colors.primary} />
                </Pressable>
                <Text style={styles.subtotal}>{formatRupiah(item.product.price * item.qty)}</Text>
              </View>
            </View>
            <Pressable style={styles.deleteBtn} onPress={() => handleRemove(item.product.id, item.product.name)}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
          </View>
        )}
      />

      {/* Footer dengan safe area padding */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <View>
          <Text style={styles.footerLabel}>Total belanja</Text>
          <Text style={styles.footerPrice}>{formatRupiah(totalPrice)}</Text>
        </View>
        <Pressable style={styles.checkoutBtn} onPress={() => router.push('/(customer)/checkout')}>
          <Text style={styles.checkoutBtnText}>Checkout</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.white} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  heading: { fontFamily: fonts.display, fontSize: 22, color: colors.primary, padding: spacing.lg, paddingBottom: spacing.sm },
  list: { paddingHorizontal: spacing.md },
  card: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm, padding: spacing.sm, alignItems: 'center' },
  cardImg: { width: 70, height: 70, borderRadius: radius.sm, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginRight: spacing.sm },
  img: { width: 70, height: 70 },
  cardInfo: { flex: 1 },
  productName: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textPrimary },
  productPrice: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.xs },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary, minWidth: 24, textAlign: 'center' },
  subtotal: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.primary, marginLeft: spacing.sm },
  deleteBtn: { padding: spacing.sm },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.textPrimary, marginTop: spacing.md },
  emptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
  shopBtn: { marginTop: spacing.lg, backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.xl },
  shopBtnText: { fontFamily: fonts.bodySemiBold, color: colors.white, fontSize: 14 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border,
    elevation: 8,
  },
  footerLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted },
  footerPrice: { fontFamily: fonts.display, fontSize: 18, color: colors.primary },
  checkoutBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.lg, gap: spacing.xs },
  checkoutBtnText: { fontFamily: fonts.bodySemiBold, color: colors.white, fontSize: 15 },
});