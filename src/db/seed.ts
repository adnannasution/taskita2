import { getDb } from './client';
import { hashPassword } from '../utils/hash';

export async function seedDatabase() {
  const db = await getDb();

  const adminExists = await db.getFirstAsync('SELECT id FROM users WHERE role = ?', ['admin']);
  if (!adminExists) {
    const passwordHash = await hashPassword('admin123');
    await db.runAsync(
      'INSERT INTO users (name, username, password_hash, role) VALUES (?, ?, ?, ?)',
      ['Admin Tas Kita', 'admin', passwordHash, 'admin']
    );
  }

  const productCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM products'
  );
  if (!productCount || productCount.count === 0) {
    const sampleProducts: [string, string, number, string, number][] = [
      ['Tas Selempang Kanvas', 'Tas selempang bahan kanvas tebal, cocok untuk harian.', 125000, 'Selempang', 12],
      ['Tas Tote Kulit Sintetis', 'Tas tote minimalis, muat laptop 14 inch.', 185000, 'Tote', 8],
      ['Tas Ransel Mini', 'Ransel mini serbaguna untuk jalan-jalan.', 145000, 'Ransel', 15],
    ];
    for (const [name, description, price, category, stock] of sampleProducts) {
      await db.runAsync(
        'INSERT INTO products (name, description, price, category, stock) VALUES (?, ?, ?, ?, ?)',
        [name, description, price, category, stock]
      );
    }
  }
}
