import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../src/constants/theme';

export default function AdminLayout() {
  return (
    <Drawer
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontFamily: fonts.bodySemiBold },
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.textSecondary,
        drawerLabelStyle: { fontFamily: fonts.bodyMedium },
      }}
    >
      <Drawer.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          drawerIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="verify-payments"
        options={{
          title: 'Verifikasi pembayaran',
          drawerIcon: ({ color, size }) => <Ionicons name="checkmark-circle-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="products"
        options={{
          title: 'Produk & stok',
          drawerIcon: ({ color, size }) => <Ionicons name="cube-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="reports"
        options={{
          title: 'Laporan keuangan',
          drawerIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          title: 'Profil',
          drawerIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Drawer>
  );
}
