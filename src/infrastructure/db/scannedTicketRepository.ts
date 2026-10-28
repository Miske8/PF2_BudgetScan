/**
 * ScannedTicketRepository — implémentation SQLite.
 */

import type { NewScannedTicketInput, ScannedTicket } from '@/core/types/models';
import type { ScannedTicketRepository } from '@/core/ports/repositories';
import { getDatabase } from '../database';
import { newId, now } from '../mappers';

interface TicketRow {
  id: string;
  user_id: string;
  image_uri: string;
  extracted_amount: number | null;
  extracted_date: number | null;
  raw_text: string | null;
  created_at: number;
}

function toTicket(row: TicketRow): ScannedTicket {
  return {
    id: row.id,
    userId: row.user_id,
    imageUri: row.image_uri,
    extractedAmount: row.extracted_amount,
    extractedDate: row.extracted_date,
    rawText: row.raw_text,
    createdAt: row.created_at,
  };
}

export function createSqliteScannedTicketRepository(): ScannedTicketRepository {
  return {
    async create(input: NewScannedTicketInput & { id?: string }): Promise<ScannedTicket> {
      const db = await getDatabase();
      const timestamp = now();
      const ticketId = input.id ?? newId();
      // Upsert : un ticket peut d'abord être créé juste après la capture
      // (extraction vide), puis son résultat OCR est enregistré via updateExtraction.
      await db.runAsync(
        `INSERT INTO scanned_tickets
           (id, user_id, image_uri, extracted_amount, extracted_date, raw_text, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (id) DO UPDATE SET
           extracted_amount = COALESCE(excluded.extracted_amount, extracted_amount),
           extracted_date   = COALESCE(excluded.extracted_date, extracted_date),
           raw_text         = COALESCE(excluded.raw_text, raw_text)`,
        [
          ticketId,
          input.userId,
          input.imageUri,
          input.extractedAmount ?? null,
          input.extractedDate ?? null,
          input.rawText ?? null,
          timestamp,
        ],
      );
      const row = await db.getFirstAsync<TicketRow>(
        'SELECT * FROM scanned_tickets WHERE id = ?',
        ticketId,
      );
      if (!row) throw new Error('Ticket introuvable après création.');
      return toTicket(row);
    },

    async findById(id: string): Promise<ScannedTicket | null> {
      const db = await getDatabase();
      const row = await db.getFirstAsync<TicketRow>(
        'SELECT * FROM scanned_tickets WHERE id = ?',
        id,
      );
      return row ? toTicket(row) : null;
    },

    async updateExtraction(
      id: string,
      patch: Partial<Pick<ScannedTicket, 'extractedAmount' | 'extractedDate' | 'rawText'>>,
    ): Promise<void> {
      const db = await getDatabase();
      if (patch.extractedAmount !== undefined) {
        await db.runAsync('UPDATE scanned_tickets SET extracted_amount = ? WHERE id = ?', [
          patch.extractedAmount,
          id,
        ]);
      }
      if (patch.extractedDate !== undefined) {
        await db.runAsync('UPDATE scanned_tickets SET extracted_date = ? WHERE id = ?', [
          patch.extractedDate,
          id,
        ]);
      }
      if (patch.rawText !== undefined) {
        await db.runAsync('UPDATE scanned_tickets SET raw_text = ? WHERE id = ?', [patch.rawText, id]);
      }
    },
  };
}
