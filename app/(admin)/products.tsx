import { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, Pressable, Image, Alert,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getDb } from '../../src/db/client';
import { colors, fonts, spacing, radius } from '../../src/constants/theme';
import { formatRupiah } from '../../src/utils/format';
import type { Product } from '../../src/types';

export default function AdminProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);

  const loadProducts = useCallback(async () => {
    const db = await getDb();
    const rows = await db.getAllAsync<Product>('SELECT * FROM products ORDER BY created_at DESC');
    setProducts(rows);
  }, []);

  useFocusEffect(useCallback(() => { loadProducts(); }, [loadProducts]));

  async function handleToggleActive(product: Product) {
    const db = await getDb();
    await db.runAsync('UPDATE products SET is_active = ? WHERE id = ?', [
      product.is_active ? 0 : 1,
      product.id,
    ]);
    loadProducts();
  }

  async function handleDelete(product: Product) {
    Alert.alert('Hapus produk?', `"${product.name}" akan dihapus permanen.`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive', onPress: async () => {
          const db = await getDb();
          await db.runAsync('DELETE FROM products WHERE id = ?', [product.id]);
          loadProducts();
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Belum ada produk. Tambah dengan tombol + di bawah.</Text>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, !item.is_active && styles.cardInactive]}>
            <View style={styles.cardLeft}>
              {item.photo_uri ? (
                <Image source={{ uri: item.photo_uri }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="bag-outline" size={24} color={colors.textMuted} />
                </View>
              )}
            </View>
            <View style={styles.cardMiddle}>
              <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.productCategory}>{item.category ?? '-'}</Text>
              <Text style={styles.productPrice}>{formatRupiah(item.price)}</Text>
              <Text style={styles.productStock}>Stok: {item.stock}</Text>
              {!item.is_active && <Text style={styles.inactiveLabel}>Nonaktif</Text>}
            </View>
            <View style={styles.cardActions}>
              <Pressable
                style={styles.actionBtn}
                onPress={() => router.push({ pathname: '/(admin)/product-form', params: { id: String(item.id) } })}
              >
                <Ionicons name="pencil-outline" size={20} color={colors.primary} />
              </Pressable>
              <Pressable style={styles.actionBtn} onPress={() => handleToggleActive(item)}>
                <Ionicons
                  name={item.is_active ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textSecondary}
                />
              </Pressable>
              <Pressable style={styles.actionBtn} onPress={() => handleDelete(item)}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            </View>
          </View>
        )}
      />
      <Pressable style={styles.fab} onPress={() => router.push('/(admin)/product-form')}>
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, paddingBottom: 100 },
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  cardInactive: { opacity: 0.5 },
  cardLeft: { width: 80, height: 80 },
  photo: { width: 80, height: 80 },
  photoPlaceholder: { width: 80, height: 80, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  cardMiddle: { flex: 1, padding: spacing.sm },
  productName: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textPrimary },
  productCategory: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted },
  productPrice: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.primary, marginTop: 2 },
  productStock: { fontFamily: fonts.body, fontSize: 11, color: colors.textSecondary },
  inactiveLabel: { fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.danger, marginTop: 2 },
  cardActions: { justifyContent: 'space-around', paddingHorizontal: spacing.sm },
  actionBtn: { padding: spacing.xs },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
});
