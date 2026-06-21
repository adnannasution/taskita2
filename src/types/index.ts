export type Role = 'admin' | 'customer';

export interface User {
  id: number;
  name: string;
  username: string;
  role: Role;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  stock: number;
  photo_uri: string | null;
  is_active: number;
  created_at: string;
}

export type OrderStatus =
  | 'menunggu_verifikasi'
  | 'dibayar'
  | 'diproses'
  | 'dikirim'
  | 'selesai'
  | 'ditolak'
  | 'dibatalkan';

export interface Order {
  id: number;
  customer_id: number | null;
  sale_channel: 'online' | 'offline';
  status: OrderStatus;
  total: number;
  alamat_pengiriman: string | null;
  catatan: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  qty: number;
  price: number;
}

export interface Payment {
  id: number;
  order_id: number;
  bukti_transfer_uri: string | null;
  status: 'pending' | 'verified' | 'rejected';
  verified_by: number | null;
  verified_at: string | null;
  uploaded_at: string;
}

export interface StockMovement {
  id: number;
  product_id: number;
  type: 'masuk' | 'keluar';
  qty: number;
  source: 'order' | 'restock' | 'manual_sale' | 'adjustment';
  note: string | null;
  created_at: string;
}
