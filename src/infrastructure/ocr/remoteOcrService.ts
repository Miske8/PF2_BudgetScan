/**
 * RemoteOcrService — squelette d'intégration future (NON activé dans le MVP).
 *
 * Activé automatiquement par resolveOcrService() dès que
 * EXPO_PUBLIC_OCR_API_URL est renseignée dans .env. Contrat attendu côté
 * serveur :
 *
 *   POST {EXPO_PUBLIC_OCR_API_URL}/v1/receipts
 *   Headers: Authorization: Bearer {EXPO_PUBLIC_OCR_API_KEY}
 *   Body (multipart/form-data): file=<jpeg>, lang="fr"
 *   Réponse JSON: { amount: number|null, date: string|null (ISO),
 *                   merchant: string|null, rawText: string, confidence: number }
 *
 * L'implémentation réelle viendra en phase post-MVP ; ici le code est complet
 * et testable contre n'importe quel mock HTTP respectant ce contrat.
 */

import type { OcrReceiptResult, OcrService } from '@/core/ports/ocr';
import { OcrError } from '@/core/ports/ocr';

export interface RemoteOcrConfig {
  baseUrl: string;
  apiKey?: string;
  /** Timeout client en ms (défaut 15 000). */
  timeoutMs?: number;
}

export function createRemoteOcrService(config: RemoteOcrConfig): OcrService {
  const timeoutMs = config.timeoutMs ?? 15_000;

  return {
    engineId: 'cloud-api',
    isMock: false,

    async extractFromImage(imageUri: string): Promise<OcrReceiptResult> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        // expo-file-system : lecture binaire -> FormData multipart.
        const { File } = await import('expo-file-system');
        const file = new File(imageUri);

        const form = new FormData();
        form.append('file', file as unknown as Blob);
        form.append('lang', 'fr');

        const response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/v1/receipts`, {
          method: 'POST',
          headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : undefined,
          body: form,
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new OcrError('NETWORK', `Service OCR indisponible (HTTP ${response.status}).`);
        }

        const json = (await response.json()) as {
          amount?: number | null;
          date?: string | null;
          merchant?: string | null;
          rawText?: string;
          confidence?: number;
        };

        const parsedDate = json.date ? new Date(json.date).getTime() : null;
        return {
          amount: typeof json.amount === 'number' && json.amount > 0 ? json.amount : null,
          date: parsedDate !== null && !Number.isNaN(parsedDate) ? parsedDate : null,
          merchant: json.merchant ?? null,
          rawText: json.rawText ?? '',
          confidence: typeof json.confidence === 'number' ? json.confidence : 0.5,
        };
      } catch (err) {
        if (err instanceof OcrError) throw err;
        if (err instanceof Error && err.name === 'AbortError') {
          throw new OcrError('TIMEOUT', "L'analyse a dépassé le délai imparti.");
        }
        throw new OcrError('NETWORK', "Impossible de joindre le service OCR. Vérifiez votre connexion.");
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
