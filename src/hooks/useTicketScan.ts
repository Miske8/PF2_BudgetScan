/**
 * useTicketScan — machine à états du flux Scan (écran /scan).
 *
 * idle → capturing → analyzing → done | error
 *
 * Capture : CameraView.takePictureAsync (quality 0.5) puis normalisation via
 * expo-image-manipulator (max 1280 px, JPEG 70 %) pour limiter le poids de
 * l'image avant OCR/stockage. Galerie : expo-image-picker (même pipeline).
 * Analyse : déléguée à ticketService → port OcrService (mock ou API).
 */

import { useCallback, useRef, useState } from 'react';
import { CameraView, useCameraPermissions, type CameraPictureOptions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { TicketAnalysis } from '@/services';
import { ticketService } from '@/services';
import { useAuthContext } from './useAuthContext';

export type ScanPhase = 'idle' | 'capturing' | 'analyzing' | 'done' | 'error';

export interface UseTicketScanResult {
  phase: ScanPhase;
  /** true une fois la permission caméra accordée (null = interrogée). */
  cameraPermissionGranted: boolean | null;
  requestCameraPermission: () => Promise<void>;
  /** Callback de réf à câbler sur <CameraView ref={cameraRefCallback} />. */
  cameraRefCallback: (node: CameraView | null) => void;
  /** Résultat complet de l'analyse (phase === 'done'). */
  analysis: TicketAnalysis | null;
  errorMessage: string | null;
  takePhoto: () => Promise<void>;
  pickFromGallery: () => Promise<void>;
  /** Relancer l'OCR sur la même image (bouton "Réessayer"). */
  retry: () => Promise<void>;
  reset: () => void;
}

/** Réduit la taille d'une capture avant analyse/archivage. Best-effort. */
async function normalizeImage(uri: string): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1280 } }],
      { compress: 0.7, format: SaveFormat.JPEG },
    );
    return result.uri;
  } catch {
    // La normalisation est un confort, pas un prérequis : on garde l'original.
    return uri;
  }
}

const CAPTURE_OPTIONS: CameraPictureOptions = { quality: 0.5 };

export function useTicketScan(): UseTicketScanResult {
  const { user } = useAuthContext();
  const [permission, askForPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [analysis, setAnalysis] = useState<TicketAnalysis | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView | null>(null);
  /** Dernière image capturée — permet "Réessayer" sans repasser par la caméra. */
  const lastImageUri = useRef<string | null>(null);

  const granted = permission?.granted ?? null;

  /** Référence à passer à <CameraView ref={...}> pour takePictureAsync. */
  const setCameraRef = useCallback((node: CameraView | null) => {
    cameraRef.current = node;
  }, []);

  const requestCameraPermission = useCallback(async () => {
    if (!permission) return;
    if (!permission.granted && permission.canAskAgain) {
      await askForPermission();
    }
  }, [permission, askForPermission]);

  const analyze = useCallback(
    async (imageUri: string) => {
      if (!user) {
        setErrorMessage('Session expirée, reconnectez-vous.');
        setPhase('error');
        return;
      }
      lastImageUri.current = imageUri;
      setPhase('analyzing');
      setErrorMessage(null);
      const result = await ticketService.analyzeCapturedImage(user.id, imageUri);
      if (result.error) {
        setErrorMessage(result.error);
        setPhase('error');
      } else {
        setAnalysis(result);
        setPhase('done');
      }
    },
    [user],
  );

  const takePhoto = useCallback(async () => {
    if (!cameraRef.current || !user) return;
    setPhase('capturing');
    try {
      const picture = await cameraRef.current.takePictureAsync(CAPTURE_OPTIONS);
      if (!picture?.uri) throw new Error('CAPTURE_EMPTY');
      const normalized = await normalizeImage(picture.uri);
      await analyze(normalized);
    } catch {
      setErrorMessage('Impossible de capturer l’image. Vérifiez la permission caméra et réessayez.');
      setPhase('error');
    }
  }, [analyze, user]);

  const pickFromGallery = useCallback(async () => {
    if (!user) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.6,
        allowsEditing: false,
      });
      const asset = result.assets?.[0];
      if (result.canceled || !asset) return; // retour calme en idle
      const normalized = await normalizeImage(asset.uri);
      await analyze(normalized);
    } catch {
      setErrorMessage("Impossible de charger l'image depuis la galerie.");
      setPhase('error');
    }
  }, [analyze, user]);

  const retry = useCallback(async () => {
    if (lastImageUri.current) await analyze(lastImageUri.current);
  }, [analyze]);

  const reset = useCallback(() => {
    setPhase('idle');
    setAnalysis(null);
    setErrorMessage(null);
  }, []);

  return {
    phase,
    cameraPermissionGranted: granted,
    requestCameraPermission,
    cameraRefCallback: setCameraRef,
    analysis,
    errorMessage,
    takePhoto,
    pickFromGallery,
    retry,
    reset,
  };
}
