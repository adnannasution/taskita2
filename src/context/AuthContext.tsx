import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { getDb } from '../db/client';
import { hashPassword, verifyPassword } from '../utils/hash';
import type { Role, User } from '../types';

type AuthResult = { ok: boolean; message?: string };

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<AuthResult>;
  register: (name: string, username: string, password: string, role: Role) => Promise<AuthResult>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'taskita_session_user_id';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const savedId = await SecureStore.getItemAsync(SESSION_KEY);
      if (savedId) {
        const db = await getDb();
        const row = await db.getFirstAsync<User>(
          'SELECT id, name, username, role FROM users WHERE id = ?',
          [Number(savedId)]
        );
        if (row) setUser(row);
      }
    } finally {
      setLoading(false);
    }
  }

  async function login(username: string, password: string): Promise<AuthResult> {
    const db = await getDb();
    const row = await db.getFirstAsync<User & { password_hash: string }>(
      'SELECT id, name, username, role, password_hash FROM users WHERE username = ?',
      [username]
    );
    if (!row) return { ok: false, message: 'Akun tidak ditemukan' };
    const valid = await verifyPassword(password, row.password_hash);
    if (!valid) return { ok: false, message: 'Password salah' };

    const sessionUser: User = { id: row.id, name: row.name, username: row.username, role: row.role };
    setUser(sessionUser);
    await SecureStore.setItemAsync(SESSION_KEY, String(row.id));
    return { ok: true };
  }

  async function register(name: string, username: string, password: string, role: Role): Promise<AuthResult> {
    const db = await getDb();
    const existing = await db.getFirstAsync('SELECT id FROM users WHERE username = ?', [username]);
    if (existing) return { ok: false, message: 'Username sudah dipakai' };

    const passwordHash = await hashPassword(password);
    const result = await db.runAsync(
      'INSERT INTO users (name, username, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, username, passwordHash, role]
    );
    const sessionUser: User = { id: result.lastInsertRowId, name, username, role };
    setUser(sessionUser);
    await SecureStore.setItemAsync(SESSION_KEY, String(result.lastInsertRowId));
    return { ok: true };
  }

  async function logout() {
    setUser(null);
    await SecureStore.deleteItemAsync(SESSION_KEY);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
