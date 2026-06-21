import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { colors, fonts, spacing, radius } from '../../src/constants/theme';

export default function CustomerProfileScreen() {
  const { user, logout } = useAuth();

  function handleLogout() {
    Alert.alert('Keluar', 'Yakin mau keluar dari akun ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.username}>@{user?.username}</Text>
        <Text style={styles.role}>Akun pelanggan</Text>
      </View>
      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Keluar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  name: { fontFamily: fonts.display, fontSize: 20, color: colors.textPrimary },
  username: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  role: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.primary, marginTop: spacing.sm },
  logoutButton: {
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  logoutText: { fontFamily: fonts.bodySemiBold, color: colors.danger, fontSize: 14 },
});
