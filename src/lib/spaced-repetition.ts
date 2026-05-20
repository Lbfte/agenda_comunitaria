/**
 * Algoritmo SM-2 (SuperMemo 2) para repetição espaçada.
 *
 * Referência: https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemory-method
 *
 * Qualidades de resposta (0–5):
 *   0 — Esqueceu completamente
 *   1 — Errou mas lembrou ao ver a resposta
 *   2 — Errou mas achou fácil lembrar depois
 *   3 — Respondeu com dificuldade significativa   → "Difícil"
 *   4 — Respondeu com hesitação menor             → "Bom"
 *   5 — Respondeu sem hesitação                    → "Fácil"
 *
 * Botões da UI mapeados:
 *   "De novo"  → quality 1 (reset)
 *   "Difícil"  → quality 3
 *   "Bom"      → quality 4
 *   "Fácil"    → quality 5
 */

export type ReviewQuality = 1 | 3 | 4 | 5;

export interface SM2State {
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  next_review_at: string; // ISO datetime
}

export interface SM2Input {
  interval_days: number;
  ease_factor: number;
  repetitions: number;
}

/**
 * Mapeia os botões da UI para qualidades SM-2.
 */
export const QUALITY_MAP = {
  'de_novo': 1 as ReviewQuality,
  'dificil': 3 as ReviewQuality,
  'bom': 4 as ReviewQuality,
  'facil': 5 as ReviewQuality,
} as const;

export type DifficultyButton = keyof typeof QUALITY_MAP;

/**
 * Calcula o próximo estado do flashcard após uma revisão.
 */
export function calculateNextReview(
  current: SM2Input,
  quality: ReviewQuality
): SM2State {
  let { interval_days, ease_factor, repetitions } = current;

  if (quality < 3) {
    // Resposta incorreta — resetar
    repetitions = 0;
    interval_days = 1;
  } else {
    // Resposta correta
    repetitions += 1;

    if (repetitions === 1) {
      interval_days = 1;
    } else if (repetitions === 2) {
      interval_days = 6;
    } else {
      interval_days = Math.round(interval_days * ease_factor);
    }
  }

  // Atualizar ease factor (EF)
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  ease_factor = Math.max(1.3, ease_factor + delta);

  // Calcular próxima data de revisão
  const now = new Date();
  const next = new Date(now.getTime() + interval_days * 24 * 60 * 60 * 1000);

  return {
    interval_days,
    ease_factor: Math.round(ease_factor * 100) / 100,
    repetitions,
    next_review_at: next.toISOString(),
  };
}

/**
 * Retorna label amigável para o tempo até a próxima revisão.
 */
export function getNextReviewLabel(quality: ReviewQuality, current: SM2Input): string {
  const result = calculateNextReview(current, quality);
  const days = result.interval_days;

  if (days < 1) return '<1m';
  if (days === 1) return '1d';
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.round(days / 7)}sem`;
  return `${Math.round(days / 30)}mês`;
}
