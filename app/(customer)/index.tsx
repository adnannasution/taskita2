import { useCallback, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getDb } from '../../src/db/client';
import { colors, fonts, spacing, radius } from '../../src/constants/theme';
import { formatRupiah } from '../../src/utils/format';
import type { Product } from '../../src/types';

export default function CatalogScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadProducts = useCallback(async () => {
    const db = await getDb();
    const rows = await db.getAllAsync<Product>(
      'SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC'
    );
    setProducts(rows);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tas Kita</Text>
        <Text style={styles.subtitle}>Koleksi tas pilihan</Text>
      </View>
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <Text style={styles.empty}>Belum ada produk. Admin bisa menambahkan dari menu Produk.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.imagePlaceholder}>
              {item.photo_uri ? (
                <Image source={{ uri: item.photo_uri }} style={styles.image} />
              ) : (
                <Text style={styles.imagePlaceholderText}>Tas Kita</Text>
              )}
            </View>
            <Text style={styles.productName} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.productPrice}>{formatRupiah(item.price)}</Text>
            <Text style={styles.productStock}>{item.stock > 0 ? `Stok ${item.stock}` : 'Stok habis'}</Text>
          </View>
        )}
      />
    </View>
  );
}

const CARD_WIDTH = '48%';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.primary },
  subtitle: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  row: { justifyContent: 'space-between' },
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  imagePlaceholder: {
    height: 110,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholderText: { fontFamily: fonts.displayMedium, color: colors.textMuted, fontSize: 13 },
  productName: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textPrimary },
  productPrice: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.primary, marginTop: 4 },
  productStock: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted, marginTop: 2 },
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});
