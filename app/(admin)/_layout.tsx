import { Tabs, router } from 'expo-router';
import { Pressable, View, Text, StyleSheet, Modal, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { colors, fonts, spacing, radius } from '../../src/constants/theme';

function HeaderMenu() {
  const [visible, setVisible] = useState(false);
  const { logout } = useAuth();

  const menuItems = [
    { label: 'Laporan keuangan', icon: 'bar-chart-outline', route: '/(admin)/reports' },
    { label: 'Profil', icon: 'person-outline', route: '/(admin)/profile' },
  ] as const;

  function handleLogout() {
    setVisible(false);
    Alert.alert('Keluar', 'Yakin mau keluar?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar', style: 'destructive', onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  }

  return (
    <>
      <Pressable style={styles.menuBtn} onPress={() => setVisible(true)}>
        <Ionicons name="ellipsis-vertical" size={22} color={colors.white} />
      </Pressable>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={styles.dropdown}>
            {menuItems.map((item) => (
              <Pressable
                key={item.route}
                style={styles.menuItem}
                onPress={() => { setVisible(false); router.push(item.route as any); }}
              >
                <Ionicons name={item.icon as any} size={20} color={colors.primary} />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </Pressable>
            ))}
            <Pressable style={[styles.menuItem, styles.menuItemLast]} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color={colors.danger} />
              <Text style={[styles.menuLabel, { color: colors.danger }]}>Keluar</Text>
            </Pressable>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.primaryDark },
        headerTintColor: colors.white,
        headerTitleStyle: { fontFamily: fonts.bodySemiBold },
        headerRight: () => <HeaderMenu />,
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.primaryDark, borderTopColor: colors.primaryDark },
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 10 },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="verify-payments"
        options={{
          title: 'Verifikasi',
          tabBarIcon: ({ color, size }) => <Ionicons name="checkmark-circle-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Pesanan',
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Produk',
          tabBarIcon: ({ color, size }) => <Ionicons name="cube-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="reports" options={{ href: null, title: 'Laporan Keuangan' }} />
      <Tabs.Screen name="profile" options={{ href: null, title: 'Profil' }} />
      <Tabs.Screen name="product-form" options={{ href: null, title: 'Tambah Produk' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  menuBtn: { marginRight: spacing.md, padding: spacing.xs },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  dropdown: {
    position: 'absolute', top: 54, right: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    minWidth: 200, elevation: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, gap: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuLabel: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textPrimary },
});
