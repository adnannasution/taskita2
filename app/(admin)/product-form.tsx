import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView,
  Image, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { getDb } from '../../src/db/client';
import { colors, fonts, spacing, radius } from '../../src/constants/theme';
import type { Product } from '../../src/types';

async function saveImagePermanently(uri: string): Promise<string> {
  const filename = `product_${Date.now()}.jpg`;
  const dest = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}

export default function ProductFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (isEdit) loadProduct(); }, [id]);

  async function loadProduct() {
    const db = await getDb();
    const row = await db.getFirstAsync<Product>('SELECT * FROM products WHERE id = ?', [Number(id)]);
    if (row) {
      setName(row.name);
      setDescription(row.description ?? '');
      setPrice(String(row.price));
      setCategory(row.category ?? '');
      setStock(String(row.stock));
      setPhotoUri(row.photo_uri);
    }
  }

  async function pickFromGallery() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert('Izin diperlukan', 'Izinkan akses galeri.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        const saved = await saveImagePermanently(result.assets[0].uri);
        setPhotoUri(saved);
      }
    } catch (e: any) {
      Alert.alert('Gagal', e?.message ?? 'Tidak bisa membuka galeri.');
    }
  }

  async function takePhoto() {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { Alert.alert('Izin diperlukan', 'Izinkan akses kamera.'); return; }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        const saved = await saveImagePermanently(result.assets[0].uri);
        setPhotoUri(saved);
      }
    } catch (e: any) {
      Alert.alert('Gagal', e?.message ?? 'Tidak bisa membuka kamera.');
    }
  }

  function showPhotoOptions() {
    Alert.alert('Foto produk', 'Pilih sumber foto', [
      { text: 'Kamera', onPress: takePhoto },
      { text: 'Galeri', onPress: pickFromGallery },
      { text: 'Batal', style: 'cancel' },
    ]);
  }

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Nama produk wajib diisi'); return; }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) { Alert.alert('Harga tidak valid'); return; }
    const stockNum = parseInt(stock);
    if (isNaN(stockNum) || stockNum < 0) { Alert.alert('Stok tidak valid'); return; }

    setSaving(true);
    try {
      const db = await getDb();
      if (isEdit) {
        await db.runAsync(
          `UPDATE products SET name=?, description=?, price=?, category=?, stock=?, photo_uri=? WHERE id=?`,
          [name.trim(), description.trim() || null, priceNum, category.trim() || null, stockNum, photoUri, Number(id)]
        );
      } else {
        const result = await db.runAsync(
          `INSERT INTO products (name, description, price, category, stock, photo_uri) VALUES (?,?,?,?,?,?)`,
          [name.trim(), description.trim() || null, priceNum, category.trim() || null, stockNum, photoUri]
        );
        if (stockNum > 0) {
          await db.runAsync(
            `INSERT INTO stock_movements (product_id, type, qty, source, note) VALUES (?,?,?,?,?)`,
            [result.lastInsertRowId, 'masuk', stockNum, 'adjustment', 'Stok awal produk baru']
          );
        }
      }
      router.back();
    } catch (e: any) {
      Alert.alert('Gagal menyimpan', e?.message ?? 'Coba lagi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>{isEdit ? 'Edit produk' : 'Tambah produk'}</Text>

        <Pressable style={styles.photoBox} onPress={showPhotoOptions}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoPreview} />
          ) : (
            <View style={styles.photoEmpty}>
              <Ionicons name="camera-outline" size={36} color={colors.textMuted} />
              <Text style={styles.photoHint}>Ketuk untuk ambil/pilih foto</Text>
            </View>
          )}
        </Pressable>

        {photoUri && (
          <View style={styles.photoActionsRow}>
            <Pressable style={styles.photoActionBtn} onPress={takePhoto}>
              <Ionicons name="camera-outline" size={16} color={colors.primary} />
              <Text style={styles.photoActionText}>Kamera</Text>
            </Pressable>
            <Pressable style={styles.photoActionBtn} onPress={pickFromGallery}>
              <Ionicons name="images-outline" size={16} color={colors.primary} />
              <Text style={styles.photoActionText}>Galeri</Text>
            </Pressable>
            <Pressable style={styles.photoActionBtn} onPress={() => setPhotoUri(null)}>
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
              <Text style={[styles.photoActionText, { color: colors.danger }]}>Hapus</Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.label}>Nama produk *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nama tas..." placeholderTextColor={colors.textMuted} />

        <Text style={styles.label}>Deskripsi</Text>
        <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Deskripsi produk..." placeholderTextColor={colors.textMuted} multiline numberOfLines={3} />

        <Text style={styles.label}>Harga (Rp) *</Text>
        <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="150000" placeholderTextColor={colors.textMuted} />

        <Text style={styles.label}>Kategori</Text>
        <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="Selempang / Tote / Ransel..." placeholderTextColor={colors.textMuted} />

        <Text style={styles.label}>Stok *</Text>
        <TextInput style={styles.input} value={stock} onChangeText={setStock} keyboardType="numeric" placeholder="10" placeholderTextColor={colors.textMuted} />

        <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Menyimpan...' : 'Simpan produk'}</Text>
        </Pressable>

        <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Batal</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  heading: { fontFamily: fonts.display, fontSize: 22, color: colors.primary, marginBottom: spacing.lg },
  photoBox: { width: '100%', height: 200, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: spacing.sm },
  photoPreview: { width: '100%', height: '100%' },
  photoEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  photoHint: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: spacing.xs },
  photoActionsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  photoActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingVertical: spacing.xs + 2, gap: 4 },
  photoActionText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.primary },
  label: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textPrimary, marginBottom: spacing.xs, marginTop: spacing.md },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, fontFamily: fonts.body, fontSize: 14, color: colors.textPrimary, backgroundColor: colors.surface },
  textArea: { height: 80, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.xl },
  saveBtnText: { fontFamily: fonts.bodySemiBold, color: colors.white, fontSize: 15 },
  cancelBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  cancelBtnText: { fontFamily: fonts.bodyMedium, color: colors.textSecondary, fontSize: 14 },
});
