export const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin','customer')),
    created_at TEXT DEFAULT (datetime('now'))
  );`,
  `CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    category TEXT,
    stock INTEGER NOT NULL DEFAULT 0,
    photo_uri TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );`,
  `CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER REFERENCES users(id),
    sale_channel TEXT NOT NULL CHECK(sale_channel IN ('online','offline')) DEFAULT 'online',
    status TEXT NOT NULL CHECK(status IN ('menunggu_verifikasi','dibayar','diproses','dikirim','selesai','ditolak','dibatalkan')) DEFAULT 'menunggu_verifikasi',
    total REAL NOT NULL DEFAULT 0,
    alamat_pengiriman TEXT,
    catatan TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );`,
  `CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    product_name TEXT NOT NULL,
    qty INTEGER NOT NULL,
    price REAL NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    bukti_transfer_uri TEXT,
    status TEXT NOT NULL CHECK(status IN ('pending','verified','rejected')) DEFAULT 'pending',
    verified_by INTEGER REFERENCES users(id),
    verified_at TEXT,
    uploaded_at TEXT DEFAULT (datetime('now'))
  );`,
  `CREATE TABLE IF NOT EXISTS stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id),
    type TEXT NOT NULL CHECK(type IN ('masuk','keluar')),
    qty INTEGER NOT NULL,
    source TEXT NOT NULL CHECK(source IN ('order','restock','manual_sale','adjustment')),
    note TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );`,
];
