import { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Image, Alert, ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { getDb } from '../../src/db/client';
import { colors, fonts, spacing, radius } from '../../src/constants/theme';

async function saveImagePermanently(uri: string, prefix: string): Promise<string> {
  const filename = `${prefix}_${Date.now()}.jpg`;
  const dest = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}

export default function UploadPaymentScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function pickPhoto() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert('Izin diperlukan', 'Izinkan akses galeri.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const saved = await saveImagePermanently(result.assets[0].uri, `bukti_${orderId}`);
        setPhotoUri(saved);
      }
    } catch (e: any) {
      Alert.alert('Gagal', e?.message ?? 'Tidak bisa membuka galeri.');
    }
  }

  async function takePicture() {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { Alert.alert('Izin diperlukan', 'Izinkan akses kamera.'); return; }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const saved = await saveImagePermanently(result.assets[0].uri, `bukti_${orderId}`);
        setPhotoUri(saved);
      }
    } catch (e: any) {
      Alert.alert('Gagal', e?.message ?? 'Tidak bisa membuka kamera.');
    }
  }

  async function handleUpload() {
    if (!photoUri) { Alert.alert('Pilih foto bukti transfer dulu'); return; }
    setUploading(true);
    try {
      const db = await getDb();
      await db.runAsync(
        `UPDATE payments SET bukti_transfer_uri = ?, uploaded_at = datetime('now') WHERE order_id = ?`,
        [photoUri, Number(orderId)]
      );
      Alert.alert(
        'Berhasil!',
        'Bukti transfer berhasil diupload. Pesanan kamu sedang menunggu verifikasi admin.',
        [{ text: 'Lihat pesanan saya', onPress: () => router.replace('/(customer)/orders') }]
      );
    } catch (e: any) {
      Alert.alert('Gagal upload', e?.message ?? 'Coba lagi.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Upload bukti transfer</Text>
      <Text style={styles.sub}>Pesanan #{orderId} berhasil dibuat. Upload bukti transfer untuk diverifikasi admin.</Text>

      <View style={styles.photoBox}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="contain" />
        ) : (
          <View style={styles.photoEmpty}>
            <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
            <Text style={styles.photoHint}>Foto bukti transfer belum dipilih</Text>
          </View>
        )}
      </View>

      <View style={styles.btnRow}>
        <Pressable style={styles.pickBtn} onPress={pickPhoto}>
          <Ionicons name="images-outline" size={20} color={colors.primary} />
          <Text style={styles.pickBtnText}>Dari galeri</Text>
        </Pressable>
        <Pressable style={styles.pickBtn} onPress={takePicture}>
          <Ionicons name="camera-outline" size={20} color={colors.primary} />
          <Text style={styles.pickBtnText}>Ambil foto</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.uploadBtn, !photoUri && styles.uploadBtnDisabled]}
        onPress={handleUpload}
        disabled={!photoUri || uploading}
      >
        <Text style={styles.uploadBtnText}>{uploading ? 'Mengupload...' : 'Kirim bukti transfer'}</Text>
      </Pressable>

      <Pressable style={styles.laterBtn} onPress={() => router.replace('/(customer)/orders')}>
        <Text style={styles.laterBtnText}>Upload nanti (lihat pesanan dulu)</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  heading: { fontFamily: fonts.display, fontSize: 22, color: colors.primary },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg, lineHeight: 20 },
  photoBox: { width: '100%', height: 260, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', backgroundColor: colors.surface, marginBottom: spacing.md },
  photo: { width: '100%', height: '100%' },
  photoEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  photoHint: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: spacing.sm },
  btnRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  pickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primary, borderRadius: radius.sm, paddingVertical: spacing.sm + 2, gap: spacing.xs },
  pickBtnText: { fontFamily: fonts.bodyMedium, color: colors.primary, fontSize: 13 },
  uploadBtn: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center' },
  uploadBtnDisabled: { backgroundColor: colors.textMuted },
  uploadBtnText: { fontFamily: fonts.bodySemiBold, color: colors.white, fontSize: 15 },
  laterBtn: { paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  laterBtnText: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 13 },
});
