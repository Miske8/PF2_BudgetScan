/**
 * ticketService — Application Layer du flux Scan (étape 10).
 *
 * Responsabilités :
 *  - créer le ticket en base dès la capture (traçabilité image + userId) ;
 *  - piloter l'appel au port OcrService (moteur résolu par container.ts,
 *    jamais connu de l'UI) et persister le résultat d'extraction ;
 *  - fournir les données pré-remplies pour le formulaire de dépense.
 *
 * Le remplacement du mock par une vraie API OCR est transparent ici :
 * seul resolveOcrService() change de comportement selon .env.
 */

import type { EpochMs } from '@/core/types/models';
import type { OcrReceiptResult, OcrService } from '@/core/ports/ocr';
import { OcrError } from '@/core/ports/ocr';
import { newId } from '@/infrastructure/db/mappers';
import { getRepositories, resolveOcrService } from './container';

export interface TicketAnalysis {
  ticketId: string;
  imageUri: string;
  extraction: OcrReceiptResult | null;
  /** Message d'erreur prêt à afficher si l'analyse a échoué. */
  error: string | null;
}

export interface TicketService {
  /** Analyse complète : upsert du ticket puis extraction OCR persistée. */
  analyzeCapturedImage(userId: string, imageUri: string): Promise<TicketAnalysis>;
  /** Recharge un ticket déjà analysé (écran analyse via ?id=…). */
  getById(ticketId: string): Promise<{
    imageUri: string;
    extraction: OcrReceiptResult | null;
  } | null>;
  /** Moteur actuellement branché (affiché en settings / badge "Simulation"). */
  describeEngine(): { engineId: string; isMock: boolean };
}

/** Persiste le ticket (création ou mise à jour des champs d'extraction). */
async function persistTicket(
  userId: string,
  ticketId: string,
  imageUri: string,
  result: OcrReceiptResult | null,
): Promise<void> {
  const repo = getRepositories().tickets;
  await repo.create({
    id: ticketId,
    userId,
    imageUri,
    extractedAmount: result?.amount ?? null,
    extractedDate: result?.date ?? null,
    rawText: result?.rawText ?? null,
  });
}

export function createTicketService(ocr: () => OcrService): TicketService {
  return {
    async analyzeCapturedImage(userId, imageUri) {
      const ticketId = newId();

      // 1) Persistance immédiate de la capture (même si l'OCR échoue ensuite).
      await persistTicket(userId, ticketId, imageUri, null);

      // 2) Extraction OCR via le port (mock ou API distante).
      try {
        const result = await ocr().extractFromImage(imageUri);
        await persistTicket(userId, ticketId, imageUri, result);
        return { ticketId, imageUri, extraction: result, error: null };
      } catch (err) {
        if (err instanceof OcrError) {
          return { ticketId, imageUri, extraction: null, error: err.message };
        }
        if (err instanceof Error && err.message) {
          return { ticketId, imageUri, extraction: null, error: err.message };
        }
        return {
          ticketId,
          imageUri,
          extraction: null,
          error: "Échec inattendu de l'analyse. Réessayez ou saisissez la dépense manuellement.",
        };
      }
    },

    async getById(ticketId) {
      const ticket = await getRepositories().tickets.findById(ticketId);
      if (!ticket) return null;
      const hasExtraction =
        ticket.extractedAmount !== null ||
        ticket.extractedDate !== null ||
        (ticket.rawText?.length ?? 0) > 0;
      const extraction: OcrReceiptResult | null = hasExtraction
        ? {
            amount: ticket.extractedAmount,
            date: ticket.extractedDate,
            merchant: null,
            rawText: ticket.rawText ?? '',
            confidence: ticket.extractedAmount !== null ? 0.85 : 0.4,
          }
        : null;
      return { imageUri: ticket.imageUri, extraction };
    },

    describeEngine() {
      const service = ocr();
      return { engineId: service.engineId, isMock: service.isMock };
    },
  };
}

/** Instance prête à l'emploi (moteur résolu paresseusement via container). */
export const ticketService = createTicketService(() => resolveOcrService());

/** Utilitaire partagé : epoch ms → JJ/MM/AAAA (cohérent avec le schéma Zod). */
export function toFrDate(value: EpochMs | number | null | undefined): string | undefined {
  if (value === null || value === undefined) return undefined;
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}
