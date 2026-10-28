/**
 * UserRepository — implémentation SQLite.
 */

import type { User } from '@/core/types/models';
import type { UserRepository } from '@/core/ports/repositories';
import { getDatabase } from '../database';

interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: number;
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
  };
}

export function createSqliteUserRepository(): UserRepository {
  return {
    async create(user: User): Promise<void> {
      const db = await getDatabase();
      await db.runAsync(
        `INSERT INTO users (id, name, email, password_hash, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [user.id, user.name, user.email.toLowerCase(), user.passwordHash, user.createdAt],
      );
    },

    async findByEmail(email: string): Promise<User | null> {
      const db = await getDatabase();
      const row = await db.getFirstAsync<UserRow>(
        'SELECT * FROM users WHERE email = ?',
        email.toLowerCase(),
      );
      return row ? toUser(row) : null;
    },

    async findById(id: string): Promise<User | null> {
      const db = await getDatabase();
      const row = await db.getFirstAsync<UserRow>('SELECT * FROM users WHERE id = ?', id);
      return row ? toUser(row) : null;
    },

    async count(): Promise<number> {
      const db = await getDatabase();
      const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM users');
      return row?.n ?? 0;
    },
  };
}
