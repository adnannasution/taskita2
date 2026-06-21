import { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
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

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Produk & stok</Text>
      <Text style={styles.subtitle}>Tambah/edit produk akan dibangun di tahap berikutnya</Text>
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productCategory}>{item.category ?? '-'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.productPrice}>{formatRupiah(item.price)}</Text>
              <Text style={styles.productStock}>Stok: {item.stock}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.primary },
  subtitle: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginBottom: spacing.md },
  list: { paddingBottom: spacing.xl },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  productName: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textPrimary },
  productCategory: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted, marginTop: 2 },
  productPrice: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.primary },
  productStock: { fontFamily: fonts.body, fontSize: 11, color: colors.textSecondary, marginTop: 2 },
});
