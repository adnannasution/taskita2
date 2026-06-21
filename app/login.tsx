import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { colors, fonts, spacing, radius } from '../src/constants/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    if (!username || !password) {
      Alert.alert('Lengkapi data', 'Username dan password wajib diisi.');
      return;
    }
    setSubmitting(true);
    const result = await login(username.trim(), password);
    setSubmitting(false);
    if (!result.ok) {
      Alert.alert('Gagal masuk', result.message ?? 'Terjadi kesalahan.');
      return;
    }
    router.replace('/');
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.brand}>Tas Kita</Text>
        <Text style={styles.tagline}>Belanja tas, kelola toko, dalam satu aplikasi</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          placeholder="contoh: admin"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor={colors.textMuted}
        />

        <Pressable style={styles.button} onPress={handleLogin} disabled={submitting}>
          <Text style={styles.buttonText}>{submitting ? 'Memproses...' : 'Masuk'}</Text>
        </Pressable>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Belum punya akun? </Text>
          <Link href="/register">
            <Text style={styles.link}>Daftar di sini</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: spacing.lg },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  brand: { fontFamily: fonts.display, fontSize: 32, color: colors.primary },
  tagline: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
  form: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  label: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textPrimary, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonText: { fontFamily: fonts.bodySemiBold, color: colors.white, fontSize: 15 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  footerText: { fontFamily: fonts.body, color: colors.textSecondary, fontSize: 13 },
  link: { fontFamily: fonts.bodySemiBold, color: colors.primary, fontSize: 13 },
});
