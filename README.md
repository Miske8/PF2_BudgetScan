# 💰 BudgetScan

Application mobile de gestion de budget personnel avec **scan de tickets de caisse**.
100 % hors ligne, données stockées localement (SQLite), aucune inscription cloud.

> 🎯 Démo express : créez un compte local → onglet **Scan** → prenez en photo
> n'importe quel ticket → le montant est extrait et pré-remplit le formulaire
> de dépense. Tout se passe sur votre appareil.

## ✨ Fonctionnalités
- 🔐 Authentification locale (email/mot de passe, hash expo-crypto, session SecureStore)
- 🏠 Dashboard : budget restant, jauge de progression, alerte dépassement, camembert par catégorie
- 🧾 Scan de ticket : caméra → OCR simulé → correction utilisateur → enregistrement
- 💸 CRUD dépenses avec filtres (mois, catégorie, recherche) et validation Zod
- 📊 Budgets globaux + par catégorie, barres de progression
- 🏷️ 7 catégories par défaut + catégories personnalisées (couleur/icône)
- 📈 Stats : répartition, tendance mensuelle, budget vs dépenses
- 🌑 Mode démo : seed de ~30 dépenses sur 3 mois

## 🧱 Stack technique
Expo SDK 54 · React Native 0.81 · TypeScript strict · Expo Router (tabs + stacks modales)
expo-sqlite · expo-secure-store · expo-camera · expo-image-picker/manipulator
React Hook Form + Zod · react-native-chart-kit + SVG · date-fns · Reanimated/Gesture Handler

## 🚀 Lancement
    git clone <repo> && cd budgetscan
    npm install --legacy-peer-deps
    cp .env.example .env
    npm start          # puis toucher "w"/"a"/"i", ou scanner le QR avec Expo Go
    npm run typecheck && npm run lint   # qualité

## 🏗️ Architecture (Ports & Adapters)
    app/            Routes Expo Router ((auth) public, (app)/AuthGuard privé)
    src/core/       Types, schémas Zod, règles métier, PORTS (interfaces)
    src/services/   Logique applicative + container.ts (racine de composition)
    src/infrastructure/  Adapters : SQLite, SecureStore, OCR mock/remote
    src/hooks/      Hooks écran (useTicketScan, useExpenses, useDashboard…)
    src/components/ ui/ (Button, Input, Card…) + domain/ (BudgetSummaryCard…)

## 🔍 Le service OCR mock — comment ça marche
Le port `OcrService` (src/core/ports/ocr.ts) définit `extractFromImage(uri)`.
`MockOcrService` : hash FNV-1a de l'URI → profil de ticket déterministe
(Carrefour, Uber… avec rawText plausible), latence simulée 600–1400 ms,
~8 % d'échecs volontaires pour tester l'état d'erreur de l'UI.
Pour brancher une vraie API : renseigner EXPO_PUBLIC_OCR_API_URL (+ KEY) →
le container bascule sur `RemoteOcrService`. Zéro écran à modifier.

## 🗺️ Améliorations futures
- OCR réel : Google ML Kit (local/offline) ou Cloud Vision (API)
- Notifications push de seuil (80 % / 100 % budget)
- Export CSV/PDF, sync multi-appareils (Supabase/Firebase)
- Tests unitaires Jest + E2E Maestro, CI GitHub Actions
- Multi-devises, récurrents, budgets annuels glissants

## ♻️ Supprimer les données de démo
Réglages → "Réinitialiser les données" (ou désinstaller l'app).
