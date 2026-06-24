import { useCallback, useState } from 'react';
import {
  View, Text, FlatList, Image, StyleSheet,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
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

  useFocusEffect(useCallback(() => { loadProducts(); }, [loadProducts]));

  async function handleRefresh() {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <Text style={styles.subtitle}>Koleksi tas pilihan untuk kamu</Text>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Belum ada produk tersedia.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/(customer)/product-detail', params: { id: String(item.id) } })}
          >
            <View style={styles.imageBox}>
              {item.photo_uri ? (
                <Image source={{ uri: item.photo_uri }} style={styles.image} resizeMode="cover" />
              ) : (
                <View style={styles.imageFallback}>
                  <Text style={styles.imageFallbackText}>🛍️</Text>
                </View>
              )}
              {item.stock === 0 && (
                <View style={styles.soldOutOverlay}>
                  <Text style={styles.soldOutText}>Habis</Text>
                </View>
              )}
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
              {item.category ? <Text style={styles.productCategory}>{item.category}</Text> : null}
              <Text style={styles.productPrice}>{formatRupiah(item.price)}</Text>
              <Text style={styles.productStock}>
                {item.stock > 0 ? `Stok: ${item.stock}` : 'Stok habis'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  subtitle: {
    fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary,
    paddingHorizontal: spacing.xs, paddingTop: spacing.sm, paddingBottom: spacing.md,
  },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  row: { justifyContent: 'space-between' },
  card: {
    width: '48.5%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  imageBox: { width: '100%', height: 130, position: 'relative' },
  image: { width: '100%', height: '100%' },
  imageFallback: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.background,
  },
  imageFallbackText: { fontSize: 36 },
  soldOutOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center',
  },
  soldOutText: { fontFamily: fonts.bodySemiBold, color: colors.white, fontSize: 14 },
  cardInfo: { padding: spacing.sm },
  productName: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textPrimary, lineHeight: 17 },
  productCategory: { fontFamily: fonts.body, fontSize: 10, color: colors.textMuted, marginTop: 1 },
  productPrice: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.primary, marginTop: 3 },
  productStock: { fontFamily: fonts.body, fontSize: 10, color: colors.textMuted, marginTop: 1 },
});
