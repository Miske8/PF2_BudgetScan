/**
 * PORT OCR — contrat unique entre l'UI et n'importe quel moteur d'extraction.
 * Implémentations : MockOcrService (MVP), RemoteApiOcrService (futur),
 * LocalMlKitOcrService (envisagé). Le choix se fait dans services/container.ts
 * selon les variables d'environnement — aucun écran ne connaît le moteur réel.
 */

import type { EpochMs } from '../types/models';

export interface OcrReceiptResult {
  /** Montant total détecté (null si non trouvé). */
  amount: number | null;
  /** Date du ticket (null si non détectée). */
  date: EpochMs | null;
  /** Texte brut reconnu (affiché pour debug/correction utilisateur). */
  rawText: string;
  /** Confiance globale 0..1 ; < 0.5 => l'UI doit avertir et proposer une correction. */
  confidence: number;
  /** Nom du magasin/enseigne si identifiable (pré-remplissage du titre). */
  merchant: string | null;
}

export interface OcrService {
  /** Identifiant de moteur, affiché en dev (ex. "mock", "cloud-vision"). */
  readonly engineId: string;
  /** true tant que l'implémentation est une simulation. */
  readonly isMock: boolean;
  /**
   * Analyse une image de ticket depuis une URI locale (file://…).
   * Lève une erreur si l'analyse échoue (l'UI affiche alors un état d'erreur
   * avec possibilité de réessayer).
   */
  extractFromImage(imageUri: string): Promise<OcrReceiptResult>;
}
