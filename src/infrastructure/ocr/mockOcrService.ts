/**
 * MockOcrService — implémentation SIMULÉE du port OcrService (MVP, hors ligne).
 *
 * Stratégie de simulation (déterministe mais réaliste) :
 *  - le hash de l'URI de l'image choisit un "profil de ticket" parmi une
 *    petite bibliothèque (Carrefour, Relais H, Uber…). Chaque profil contient
 *    un texte OCR plausible, un montant, une date et une confiance ;
 *  - une latence réseau simulée (600–1400 ms) rend visible l'état "analyse…" ;
 *  - ~8 % des analyses échouent volontairement (IMAGE_UNREADABLE) pour que
 *    l'UI soit testée en conditions d'erreur réelle.
 *
 * Remplacer par une vraie API : créer remoteOcrService.ts (même port), puis
 * ajuster resolveOcrService() dans services/container.ts. Aucun écran à toucher.
 */

import type { EpochMs } from '@/core/types/models';
import type { OcrReceiptResult, OcrService } from '@/core/ports/ocr';
import { OcrError } from '@/core/ports/ocr';

interface TicketProfile {
  merchant: string;
  amount: number;
  /** Décalage en jours depuis aujourd'hui (négatif = passé). */
  dayOffset: number;
  rawText: string;
  confidence: number;
}

const PROFILES: TicketProfile[] = [
  {
    merchant: 'CARREFOUR CITY',
    amount: 23.47,
    dayOffset: 0,
    confidence: 0.92,
    rawText: [
      'CARREFOUR CITY 12 RUE DE LA PAIX',
      'LETTUE 1.89  POMMES 3.20  PAIN 1.10',
      'LAIT DEMI-ECREME 0.95  CHOCOLAT 2.45',
      'TOTAL ARTICLES 6    TOTAL TTC 23,47 EUR',
      'CB ***1234   MERCI DE VOTRE VISITE',
    ].join('\n'),
  },
  {
    merchant: 'Relais H Gare du Nord',
    amount: 8.9,
    dayOffset: -1,
    confidence: 0.85,
    rawText: [
      'RELAIS H - GARE DU NORD',
      'SANDWICH JAMBON BEURRE 4,50',
      'CAFE NOIR 2,00  EAU MINERALE 2,40',
      'SOUS-TOTAL 8,90   TOTAL 8,90 EUR',
      'TICKET No 004512',
    ].join('\n'),
  },
  {
    merchant: 'UBER',
    amount: 14.3,
    dayOffset: -2,
    confidence: 0.78,
    rawText: [
      'UBER TRIP RECEIPT',
      'TRIP 14/09  18:42  ECONOMY',
      'FARE 12,10  BOOKING FEE 1,20  SERVICE 1,00',
      'TOTAL DUE 14,30 EUR   VISA ***9021',
    ].join('\n'),
  },
  {
    merchant: 'Pharmacie Centrale',
    amount: 7.25,
    dayOffset: -3,
    confidence: 0.88,
    rawText: [
      'PHARMACIE CENTRALE',
      'PARACETAMOL 2,65  PANSEMENTS 3,10',
      'GEL HYDROALCOOLIQUE 1,50',
      'TOTAL TTC 7,25 EUR   REMBOURSE 1,00',
    ].join('\n'),
  },
  {
    merchant: 'Monoprix',
    amount: 41.12,
    dayOffset: -4,
    confidence: 0.9,
    rawText: [
      'MONOPRIX 45 AVENUE VICTOR HUGO',
      'PATES 1,45  SAUCE TOMATE 1,99  CAFE MOULU 6,90',
      'YAOURTS x8 5,60  RIZ 2,30  HUILE OLIVE 8,95',
      'JUS D ORANGE 3,49  FROMAGE 5,94',
      'TOTAL TTC 41,12 EUR   CARTE FIDELITE ****4471',
    ].join('\n'),
  },
];

/** Petit hash FNV-1a → index stable dans les profils selon l'URI capturée. */
function hashUri(uri: string): number {
  let h = 2166136261;
  for (let i = 0; i < uri.length; i++) {
    h ^= uri.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function createMockOcrService(): OcrService {
  return {
    engineId: 'mock-local',
    isMock: true,

    async extractFromImage(imageUri: string): Promise<OcrReceiptResult> {
      if (!imageUri) {
        throw new OcrError('IMAGE_UNREADABLE', 'Aucune image à analyser.');
      }

      // Latence simulée : l'UI affiche son état "analyse en cours".
      const latency = 600 + (hashUri(imageUri) % 800);
      await sleep(latency);

      const h = hashUri(imageUri);

      // ~8 % d'échecs simulés pour éprouver le parcours d'erreur de l'UI.
      if (h % 100 < 8) {
        throw new OcrError(
          'IMAGE_UNREADABLE',
          'Le ticket est illisible (lumière insuffisante ou image floue). Réessayez ou saisissez la dépense manuellement.',
        );
      }

      const profile = PROFILES[h % PROFILES.length] ?? PROFILES[0];
      if (!profile) throw new OcrError('IMAGE_UNREADABLE', 'Aucun modèle de ticket disponible.');
      const extractedDate: EpochMs = Date.now() + profile.dayOffset * 24 * 60 * 60 * 1000;

      return {
        amount: profile.amount,
        date: extractedDate,
        rawText: profile.rawText,
        confidence: profile.confidence,
        merchant: profile.merchant,
      };
    },
  };
}
