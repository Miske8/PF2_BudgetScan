/**
 * Écran Scan — onglet central de la bottom navigation (étape 10).
 *
 * Machine à états portée par useTicketScan :
 *   idle (caméra live) → capturing → analyzing (feedback visuel) → done | error
 *
 * - Permission caméra demandée au montage ; refus définitif → EmptyState avec
 *   alternatives (galerie / saisie manuelle).
 * - Phase "analyzing" : overlay d'analyse (ligne de scan + chip) pour le
 *   feedback visuel exigé pendant le scan.
 * - Phase "done" : prévisualisation + résumé d'extraction, puis navigation
 *   vers /tickets/analyze?id=…&amount=…&date=…&title=… (formulaire pré-rempli).
 */

import React from 'react';
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, EmptyState, Header } from '@/components/ui';
import { theme } from '@/theme';
import type { TicketAnalysis } from '@/services';
import { ticketService, toFrDate } from '@/services';
import { useTicketScan } from '@/hooks/useTicketScan';

export default function ScanScreen() {
  const router = useRouter();
  const scan = useTicketScan();
  const [permission] = useCameraPermissions();
  const engine = ticketService.describeEngine();

  // Refus définitif de la permission caméra → repli sans écran noir.
  if (permission && !permission.granted && !permission.canAskAgain) {
    return (
      <View style={styles.container}>
        <Header title="Scanner un ticket" />
        <EmptyState
          icon="camera-outline"
          title="Accès caméra refusé"
          message="BudgetScan ne peut pas ouvrir l’appareil photo. Vous pouvez importer une photo depuis la galerie ou saisir la dépense manuellement."
          actionLabel="Importer depuis la galerie"
          onAction={() => void scan.pickFromGallery()}
        />
        <View style={styles.manualFallback}>
          <Button label="Saisir manuellement" variant="ghost" onPress={() => router.push('/expenses/new')} />
        </View>
      </View>
    );
  }

  const goToAnalyze = () => {
    if (!scan.analysis) return;
    const ex = scan.analysis.extraction;
    const params: Record<string, string> = { id: scan.analysis.ticketId };
    if (ex?.amount != null) params.amount = String(ex.amount);
    if (ex?.date != null && toFrDate(ex.date)) params.date = toFrDate(ex.date) as string;
    if (ex?.merchant) params.title = ex.merchant;
    router.push({ pathname: '/tickets/analyze', params });
  };

  const analyzing = scan.phase === 'analyzing' || scan.phase === 'capturing';

  return (
    <View style={styles.container}>
      <Header
        title="Scanner un ticket"
        actions={[
          {
            icon: engine.isMock ? 'flask-outline' : 'cloud-outline',
            label: engine.isMock ? 'Moteur OCR en mode simulation' : 'Moteur OCR distant',
            onPress: () => {},
          },
        ]}
      />

      <View style={styles.cameraArea}>
        {permission?.granted ? (
          <CameraView
            ref={scan.cameraRefCallback}
            style={StyleSheet.absoluteFill}
            facing="back"
            mode="picture"
            animateShutter
          />
        ) : (
          <View style={styles.permissionFallback}>
            <Text style={styles.permissionText}>
              {permission === null ? 'Préparation de la caméra…' : 'Autorisez l’accès à la caméra pour scanner vos tickets.'}
            </Text>
            {permission && !permission.granted ? (
              <Button label="Activer la caméra" onPress={() => void scan.requestCameraPermission()} testID="scan-ask-permission" />
            ) : null}
          </View>
        )}

        {/* Cadre de visée façon scanner */}
        {permission?.granted && !analyzing ? (
          <View pointerEvents="none" style={styles.reticleOuter}>
            <View style={[styles.reticleCorner, styles.tl]} />
            <View style={[styles.reticleCorner, styles.tr]} />
            <View style={[styles.reticleCorner, styles.bl]} />
            <View style={[styles.reticleCorner, styles.br]} />
          </View>
        ) : null}

        {/* Feedback visuel pendant la capture / l'analyse */}
        {analyzing ? (
          <View style={styles.analyzingOverlay} pointerEvents="none" testID="scan-analyzing">
            <View style={styles.scanLine} />
            <Card style={styles.analyzingChip}>
              <ActivityIndicator color={theme.colors.primary} />
              <Text style={styles.analyzingText}>
                {scan.phase === 'capturing' ? 'Capture…' : 'Analyse du ticket…'}
              </Text>
            </Card>
          </View>
        ) : null}
      </View>

      {/* Zone d'action basse */}
      <View style={styles.controls}>
        {scan.phase === 'done' && scan.analysis ? (
          <DoneSummary analysis={scan.analysis} onConfirm={goToAnalyze} onDiscard={scan.reset} />
        ) : (
          <>
            <Text style={styles.hint}>Cadrez le ticket entier, lumière naturelle recommandée.</Text>
            <View style={styles.actionRow}>
              <IconButton name="images-outline" label="Galerie" onPress={() => void scan.pickFromGallery()} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Capturer le ticket"
                testID="scan-capture"
                onPress={() => void scan.takePhoto()}
                disabled={analyzing}
                style={({ pressed }) => [
                  styles.shutter,
                  pressed && styles.shutterPressed,
                  analyzing && styles.shutterDisabled,
                ]}
              >
                <View style={styles.shutterInner} />
              </Pressable>
              <IconButton name="create-outline" label="Manuel" onPress={() => router.push('/expenses/new')} />
            </View>
          </>
        )}
      </View>

      {/* Erreur d'analyse : modale avec réessai + replis */}
      <Modal visible={scan.phase === 'error'} transparent animationType="fade" onRequestClose={scan.reset}>
        <View style={styles.modalBackdrop}>
          <Card style={styles.modalCard}>
            <Text style={styles.modalTitle}>Analyse impossible</Text>
            <Text style={styles.modalMessage}>{scan.errorMessage}</Text>
            <Button label="Réessayer l’analyse" onPress={() => void scan.retry()} testID="scan-retry" />
            <Button label="Importer une autre photo" variant="secondary" onPress={() => void scan.pickFromGallery()} />
            <Button label="Saisir manuellement" variant="ghost" onPress={scan.reset} />
          </Card>
        </View>
      </Modal>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sous-composants locaux
// ---------------------------------------------------------------------------

function IconButton({
  name,
  label,
  onPress,
}: {
  name: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={12}
      style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
    >
      <Ionicons name={name} size={24} color={theme.colors.text} />
      <Text style={styles.iconBtnLabel}>{label}</Text>
    </Pressable>
  );
}

function DoneSummary({
  analysis,
  onConfirm,
  onDiscard,
}: {
  analysis: TicketAnalysis;
  onConfirm: () => void;
  onDiscard: () => void;
}) {
  const ex = analysis.extraction;
  return (
    <Card style={styles.doneCard} testID="scan-done-summary">
      <View style={styles.doneRow}>
        <Image
          source={{ uri: analysis.imageUri }}
          style={styles.thumb}
          accessibilityLabel="Aperçu du ticket capturé"
        />
        <View style={styles.doneInfo}>
          <Text style={styles.doneTitle}>{ex?.merchant ?? 'Ticket scanné'}</Text>
          <Text style={styles.doneAmount}>{ex?.amount != null ? `${ex.amount.toFixed(2)} €` : 'Montant non détecté'}</Text>
          {ex ? (
            <Text style={styles.doneConfidence}>
              Confiance {Math.round(ex.confidence * 100)} % — vérifiez avant d’enregistrer.
            </Text>
          ) : null}
        </View>
      </View>
      <Button label="Vérifier et enregistrer" onPress={onConfirm} testID="scan-confirm" />
      <Button label="Recommencer" variant="ghost" onPress={onDiscard} />
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const RETICLE_W = 260;
const RETICLE_H = 340;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  cameraArea: { flex: 1, backgroundColor: theme.colors.text },
  manualFallback: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.md },

  permissionFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
  },
  permissionText: { ...theme.typography.body, color: theme.colors.white, textAlign: 'center' },

  reticleOuter: {
    position: 'absolute',
    width: RETICLE_W,
    height: RETICLE_H,
    alignSelf: 'center',
    top: '50%',
    marginTop: -RETICLE_H / 2,
  },
  reticleCorner: { position: 'absolute', width: 28, height: 28, borderColor: theme.colors.primary },
  tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },

  analyzingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.colors.overlay },
  scanLine: {
    position: 'absolute',
    left: '12%',
    right: '12%',
    height: 2,
    top: '35%',
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  analyzingChip: {
    alignSelf: 'center',
    top: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  analyzingText: { ...theme.typography.body, fontWeight: '600', color: theme.colors.text },

  controls: { padding: theme.spacing.md, gap: theme.spacing.sm },
  hint: { ...theme.typography.caption, color: theme.colors.textMuted, textAlign: 'center' },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  shutterPressed: { transform: [{ scale: 0.94 }] },
  shutterDisabled: { opacity: 0.5 },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.primary },
  iconBtn: { alignItems: 'center', gap: 2, minWidth: theme.touchTarget },
  iconBtnPressed: { opacity: 0.6 },
  iconBtnLabel: { ...theme.typography.caption, color: theme.colors.textMuted },

  doneCard: { gap: theme.spacing.sm },
  doneRow: { flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center' },
  thumb: { width: 64, height: 84, borderRadius: theme.radius.sm, backgroundColor: theme.colors.surfaceAlt },
  doneInfo: { flex: 1, gap: 2 },
  doneTitle: { ...theme.typography.title, color: theme.colors.text },
  doneAmount: { ...theme.typography.subtitle, color: theme.colors.primary, fontWeight: '700' },
  doneConfidence: { ...theme.typography.caption, color: theme.colors.warning },

  modalBackdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: { width: '100%', maxWidth: 420, gap: theme.spacing.sm },
  modalTitle: { ...theme.typography.title, color: theme.colors.text },
  modalMessage: { ...theme.typography.body, color: theme.colors.textMuted, marginBottom: theme.spacing.sm },
});
