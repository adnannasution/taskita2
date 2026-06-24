import { Tabs, router } from 'expo-router';
import { Pressable, View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../src/context/CartContext';
import { colors, fonts, spacing, radius } from '../../src/constants/theme';

function HeaderMenu() {
  const [visible, setVisible] = useState(false);
  const { totalItems } = useCart();

  const menuItems = [
    { label: 'Keranjang', icon: 'bag-outline', route: '/(customer)/cart', badge: totalItems },
    { label: 'Pesanan saya', icon: 'receipt-outline', route: '/(customer)/orders' },
    { label: 'Profil', icon: 'person-outline', route: '/(customer)/profile' },
  ] as const;

  return (
    <>
      <Pressable style={styles.menuBtn} onPress={() => setVisible(true)}>
        {totalItems > 0 && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{totalItems}</Text>
          </View>
        )}
        <Ionicons name="ellipsis-vertical" size={22} color={colors.white} />
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={styles.dropdown}>
            {menuItems.map((item) => (
              <Pressable
                key={item.route}
                style={styles.menuItem}
                onPress={() => {
                  setVisible(false);
                  router.push(item.route as any);
                }}
              >
                <Ionicons name={item.icon as any} size={20} color={colors.primary} />
                <Text style={styles.menuLabel}>{item.label}</Text>
                {'badge' in item && (item as any).badge > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{(item as any).badge}</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

export default function CustomerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        headerTitleStyle: { fontFamily: fonts.display, fontSize: 18 },
        headerRight: () => <HeaderMenu />,
        tabBarStyle: { display: 'none' }, // sembunyikan tab bar sepenuhnya
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Tas Kita' }} />
      <Tabs.Screen name="cart" options={{ href: null, title: 'Keranjang' }} />
      <Tabs.Screen name="orders" options={{ href: null, title: 'Pesanan Saya' }} />
      <Tabs.Screen name="profile" options={{ href: null, title: 'Profil' }} />
      <Tabs.Screen name="product-detail" options={{ href: null, title: 'Detail Produk', headerShown: false }} />
      <Tabs.Screen name="checkout" options={{ href: null, title: 'Checkout' }} />
      <Tabs.Screen name="upload-payment" options={{ href: null, title: 'Upload Bukti Transfer' }} />
      <Tabs.Screen name="order-detail" options={{ href: null, title: 'Detail Pesanan' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  menuBtn: { marginRight: spacing.md, padding: spacing.xs },
  cartBadge: {
    position: 'absolute', top: -4, right: 14, zIndex: 1,
    backgroundColor: colors.accent, borderRadius: 8,
    width: 16, height: 16, alignItems: 'center', justifyContent: 'center',
  },
  cartBadgeText: { fontFamily: fonts.bodySemiBold, fontSize: 9, color: colors.white },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  dropdown: {
    position: 'absolute', top: 54, right: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    minWidth: 180, elevation: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, gap: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  menuLabel: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textPrimary },
  badge: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  badgeText: { fontFamily: fonts.bodySemiBold, fontSize: 10, color: colors.white },
});
