/** Formatage des montants et dates — FR/EUR par défaut. */

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Variante compacte pour les gros chiffres du dashboard : "1 250 €" */
export function formatCurrencyCompact(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const str = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: Number.isInteger(rounded) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rounded);
  return `${str} €`;
}

export function formatDate(ts: number | Date): string {
  const d = typeof ts === 'number' ? new Date(ts) : ts;
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function formatTime(ts: number | Date): string {
  const d = typeof ts === 'number' ? new Date(ts) : ts;
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(d);
}

/** Pourcentage arrondi, sans décimales : 0..100+ */
export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)} %`;
}
