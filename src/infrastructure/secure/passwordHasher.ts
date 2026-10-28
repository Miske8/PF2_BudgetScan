/**
 * Hachage des mots de passe — Infrastructure Layer.
 *
 * Stratégie MVP (auth STRICTEMENT locale, aucun secret à protéger contre un
 * attaquant ayant l'appareil) :
 *   - sel aléatoire 128 bits (expo-crypto getRandomValues)
 *   - itérations sha256(sel || saltHex || password) via expo-crypto digestAsync
 *   - format stocké : "scrypt$<iterations>$<saltHex>$<hashHex>" (extensible)
 *
 * Comparaison en temps constant sur les hexadécimaux.
 *
 * ⚠️ Limite connue & assumée du MVP : Hermes n'expose pas PBKDF2/bcrypt natifs ;
 * sha256 itéré reste coûteux à casser mais moins qu'un KDF dédié. À durcir en
 * production réelle (voir README § Améliorations). La colonne `password_hash`
 * restant opaque, aucun autre code de l'app ne change si on remplace cet adaptateur.
 */

import * as Crypto from 'expo-crypto';

const ITERATIONS = 3_000; // ~moins de 300 ms sur mobile — invisible pour l'utilisateur
const PREFIX = 'sha256iter';

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function derive(password: string, saltHex: string): Promise<string> {
  let digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `budgetscan:v1:${saltHex}:${password}`,
  );
  for (let i = 1; i < ITERATIONS; i += 1) {
    digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${saltHex}:${digest}`);
  }
  return digest;
}

/** Produit un hash stockable en base (colonne password_hash). */
export async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(16);
  Crypto.getRandomValues(salt);
  const saltHex = toHex(salt);
  const hashHex = await derive(password, saltHex);
  return `${PREFIX}$${ITERATIONS}$${saltHex}$${hashHex}`;
}

/** Vérifie un mot de passe contre un hash stocké. Temps constant sur la comparaison. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== PREFIX) return false;
  const [, , saltHex, expectedHex] = parts as [string, string, string, string];
  const actualHex = await derive(password, saltHex);
  if (actualHex.length !== expectedHex.length) return false;
  let diff = 0;
  for (let i = 0; i < actualHex.length; i += 1) {
    diff |= actualHex.charCodeAt(i) ^ expectedHex.charCodeAt(i);
  }
  return diff === 0;
}
