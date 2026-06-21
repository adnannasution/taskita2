# Tas Kita

Aplikasi mobile (Expo) untuk pencatatan penjualan, stok barang, dan laporan keuangan
pada usaha penjualan tas, dengan tampilan e-commerce (katalog, keranjang, checkout
manual transfer). Semua data tersimpan lokal di SQLite — tidak ada backend terpisah.
Admin dan pelanggan memakai aplikasi yang sama di satu device, dibedakan lewat akun login.

## 1. Buat project Expo

```bash
npx create-expo-app@latest TasKita --template blank-typescript
cd TasKita
```

## 2. Install dependency

```bash
npx expo install expo-router expo-sqlite expo-file-system expo-image-picker expo-crypto expo-secure-store expo-font react-native-safe-area-context react-native-screens react-native-gesture-handler react-native-reanimated
npx expo install @expo-google-fonts/playfair-display @expo-google-fonts/inter
npm install @react-navigation/native @react-navigation/drawer @react-navigation/bottom-tabs --legacy-peer-deps
```

## 3. Aktifkan Expo Router

Buka `package.json`, ganti baris `"main"` jadi:

```json
"main": "expo-router/entry",
```

Hapus file `App.tsx` dan `index.ts` bawaan template (sudah digantikan oleh folder `app/`).

## 4. Copy file dari hasil scaffold ini

Salin seluruh isi folder `app/` dan `src/` ke project kamu, juga timpa `app.json`,
`babel.config.js`, dan `tsconfig.json`.

Struktur akhir:

```
TasKita/
├── app/
│   ├── _layout.tsx        # init DB, font, AuthProvider
│   ├── index.tsx           # redirect login → role
│   ├── login.tsx
│   ├── register.tsx        # daftar akun customer
│   ├── (customer)/         # bottom tab: Beranda, Keranjang, Pesanan, Profil
│   └── (admin)/             # drawer: Dashboard, Verifikasi, Produk, Laporan, Profil
├── src/
│   ├── db/                 # schema.ts, client.ts, seed.ts
│   ├── context/AuthContext.tsx
│   ├── constants/theme.ts
│   ├── utils/               # format.ts, hash.ts
│   └── types/index.ts
```

## 5. Tambahkan asset

Siapkan `assets/icon.png` dan `assets/splash.png` (PNG, bukan ICO — minimal 1024x1024
untuk icon) sesuai referensi `app.json`.

## 6. Jalankan

```bash
npx expo start
```

Scan QR code dengan Expo Go.

## Akun default

Saat pertama kali dijalankan, database otomatis terisi (seed):

- **Admin** — username: `admin`, password: `admin123`
- 3 contoh produk tas

Akun customer baru dibuat lewat halaman **Daftar** di aplikasi (role customer saja —
akun admin sengaja tidak bisa didaftar publik, sudah disediakan lewat seed).

## Yang sudah jalan

- Login / register / logout (password di-hash, sesi tersimpan via `expo-secure-store`)
- Redirect otomatis ke tampilan Customer atau Admin sesuai role
- Katalog produk (customer) — baca langsung dari SQLite
- Dashboard admin — statistik produk aktif, pesanan menunggu verifikasi, omzet bulan ini
- Daftar produk (admin) — read-only dulu

## Yang dibangun di sesi berikutnya

- Keranjang & checkout (insert ke `orders` + `order_items`)
- Upload bukti transfer (`expo-image-picker` → `payments`)
- Verifikasi pembayaran admin (update status, auto insert `stock_movements`)
- Form tambah/edit produk
- Input penjualan manual/offline
- Laporan keuangan dengan grafik (chart per periode)
"# taskita2" 
