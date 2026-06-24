import { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDb } from '../../src/db/client';
import { useCart } from '../../src/context/CartContext';
import { colors, fonts, spacing, radius } from '../../src/constants/theme';
import { formatRupiah } from '../../src/utils/format';
import type { Product } from '../../src/types';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();
  const insets = useSafeAreaInsets();

  useEffect(() => { loadProduct(); }, [id]);

  async function loadProduct() {
    const db = await getDb();
    const row = await db.getFirstAsync<Product>(
      'SELECT * FROM products WHERE id = ? AND is_active = 1', [Number(id)]
    );
    setProduct(row ?? null);
  }

  function handleAddToCart() {
    if (!product) return;
    const error = addItem(product, qty);
    if (error) { Alert.alert('Gagal', error); return; }
    Alert.alert('Ditambahkan!', `${product.name} (${qty} pcs) masuk keranjang.`, [
      { text: 'Lanjut belanja', style: 'cancel' },
      { text: 'Lihat keranjang', onPress: () => router.push('/(customer)/cart') },
    ]);
  }

  if (!product) {
    return <View style={styles.center}><Text style={styles.notFound}>Produk tidak ditemukan.</Text></View>;
  }

  const footerHeight = 72 + insets.bottom;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: footerHeight }}>
        <View style={styles.imageBox}>
          {product.photo_uri ? (
            <Image source={{ uri: product.photo_uri }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="bag-outline" size={64} color={colors.textMuted} />
            </View>
          )}
        </View>

        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.info}>
          {product.category && <Text style={styles.category}>{product.category}</Text>}
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>{formatRupiah(product.price)}</Text>
          <Text style={styles.stock}>
            {product.stock > 0 ? `Stok tersedia: ${product.stock}` : 'Stok habis'}
          </Text>
          {product.description ? (
            <>
              <Text style={styles.descLabel}>Deskripsi</Text>
              <Text style={styles.desc}>{product.description}</Text>
            </>
          ) : null}

          <Text style={styles.descLabel}>Jumlah</Text>
          <View style={styles.qtyRow}>
            <Pressable style={styles.qtyBtn} onPress={() => setQty(q => Math.max(1, q - 1))}>
              <Ionicons name="remove" size={18} color={colors.primary} />
            </Pressable>
            <Text style={styles.qtyText}>{qty}</Text>
            <Pressable style={styles.qtyBtn} onPress={() => setQty(q => Math.min(product.stock, q + 1))}>
              <Ionicons name="add" size={18} color={colors.primary} />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Footer dengan safe area */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerLabel}>Total</Text>
          <Text style={styles.footerPrice}>{formatRupiah(product.price * qty)}</Text>
        </View>
        <Pressable
          style={[styles.addBtn, product.stock <= 0 && styles.addBtnDisabled]}
          onPress={handleAddToCart}
          disabled={product.stock <= 0}
        >
          <Ionicons name="bag-add-outline" size={20} color={colors.white} />
          <Text style={styles.addBtnText}>
            {product.stock > 0 ? 'Tambah ke keranjang' : 'Stok habis'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { fontFamily: fonts.body, color: colors.textMuted },
  imageBox: { width: '100%', height: 300, backgroundColor: colors.background },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: {
    position: 'absolute', top: spacing.lg, left: spacing.md,
    backgroundColor: colors.surface, borderRadius: 20,
    padding: spacing.sm, elevation: 2,
  },
  info: { padding: spacing.lg },
  category: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginBottom: spacing.xs },
  name: { fontFamily: fonts.display, fontSize: 22, color: colors.textPrimary },
  price: { fontFamily: fonts.bodySemiBold, fontSize: 20, color: colors.primary, marginTop: spacing.xs },
  stock: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  descLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textPrimary, marginTop: spacing.lg },
  desc: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 20 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  qtyBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontFamily: fonts.bodySemiBold, fontSize: 18, color: colors.textPrimary, marginHorizontal: spacing.lg },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border,
    elevation: 8,
  },
  footerTotal: { flex: 1 },
  footerLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted },
  footerPrice: { fontFamily: fonts.display, fontSize: 18, color: colors.primary },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md, gap: spacing.xs },
  addBtnDisabled: { backgroundColor: colors.textMuted },
  addBtnText: { fontFamily: fonts.bodySemiBold, color: colors.white, fontSize: 14 },
});