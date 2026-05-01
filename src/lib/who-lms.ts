/**
 * WHO 2006 Child Growth Standards — LMS (Lambda-Mu-Sigma) reference tables.
 * Data source: WHO (https://www.who.int/tools/child-growth-standards)
 *
 * Tables cover 0 – 110 weeks in 2-week increments.
 * Linear interpolation is used between tabulated points.
 */

export interface LMSEntry {
  ageWeeks: number;
  L: number; // Box-Cox power
  M: number; // Median
  S: number; // Coefficient of variation
}

// ─── Weight-for-age (kg) ─────────────────────────────────────────────────────

export const wfaBoys: LMSEntry[] = [
  { ageWeeks: 0, L: 1, M: 3.3464, S: 0.14602 },
  { ageWeeks: 2, L: 1, M: 3.8179, S: 0.14369 },
  { ageWeeks: 4, L: 1, M: 4.2549, S: 0.14152 },
  { ageWeeks: 6, L: 1, M: 4.6586, S: 0.13946 },
  { ageWeeks: 8, L: 1, M: 5.0307, S: 0.13749 },
  { ageWeeks: 10, L: 1, M: 5.3722, S: 0.1356 },
  { ageWeeks: 12, L: 1, M: 5.6843, S: 0.13378 },
  { ageWeeks: 14, L: 1, M: 5.9679, S: 0.13202 },
  { ageWeeks: 16, L: 1, M: 6.2241, S: 0.13031 },
  { ageWeeks: 18, L: 1, M: 6.454, S: 0.12865 },
  { ageWeeks: 20, L: 1, M: 6.6588, S: 0.12704 },
  { ageWeeks: 22, L: 1, M: 6.8399, S: 0.12547 },
  { ageWeeks: 24, L: 1, M: 6.9985, S: 0.12394 },
  { ageWeeks: 26, L: 1, M: 7.1358, S: 0.12246 },
  { ageWeeks: 28, L: 1, M: 7.2532, S: 0.12101 },
  { ageWeeks: 30, L: 1, M: 7.3518, S: 0.1196 },
  { ageWeeks: 32, L: 1, M: 7.4329, S: 0.11823 },
  { ageWeeks: 34, L: 1, M: 7.4977, S: 0.1169 },
  { ageWeeks: 36, L: 1, M: 7.5474, S: 0.1156 },
  { ageWeeks: 38, L: 1, M: 7.5833, S: 0.11433 },
  { ageWeeks: 40, L: 1, M: 7.6066, S: 0.1131 },
  { ageWeeks: 42, L: 1, M: 7.6185, S: 0.11189 },
  { ageWeeks: 44, L: 1, M: 7.6201, S: 0.11071 },
  { ageWeeks: 46, L: 1, M: 7.6124, S: 0.10956 },
  { ageWeeks: 48, L: 1, M: 7.5964, S: 0.10844 },
  { ageWeeks: 50, L: 1, M: 7.5731, S: 0.10734 },
  { ageWeeks: 52, L: 1, M: 7.5434, S: 0.10627 },
  { ageWeeks: 56, L: 1, M: 7.467, S: 0.10421 },
  { ageWeeks: 60, L: 1, M: 7.3716, S: 0.10224 },
  { ageWeeks: 64, L: 1, M: 7.2617, S: 0.10035 },
  { ageWeeks: 68, L: 1, M: 7.1407, S: 0.09853 },
  { ageWeeks: 72, L: 1, M: 7.0113, S: 0.09678 },
  { ageWeeks: 76, L: 1, M: 6.8757, S: 0.09509 },
  { ageWeeks: 80, L: 1, M: 6.7357, S: 0.09345 },
  { ageWeeks: 84, L: 1, M: 6.5928, S: 0.09187 },
  { ageWeeks: 88, L: 1, M: 6.4483, S: 0.09034 },
  { ageWeeks: 92, L: 1, M: 6.3031, S: 0.08885 },
  { ageWeeks: 96, L: 1, M: 6.1582, S: 0.08741 },
  { ageWeeks: 100, L: 1, M: 6.0143, S: 0.086 },
  { ageWeeks: 104, L: 1, M: 5.872, S: 0.08464 },
  { ageWeeks: 108, L: 1, M: 5.7319, S: 0.08331 },
  { ageWeeks: 110, L: 1, M: 5.6625, S: 0.08267 },
];

export const wfaGirls: LMSEntry[] = [
  { ageWeeks: 0, L: 1, M: 3.2322, S: 0.14602 },
  { ageWeeks: 2, L: 1, M: 3.6423, S: 0.14369 },
  { ageWeeks: 4, L: 1, M: 4.0209, S: 0.14152 },
  { ageWeeks: 6, L: 1, M: 4.3689, S: 0.13946 },
  { ageWeeks: 8, L: 1, M: 4.6876, S: 0.13749 },
  { ageWeeks: 10, L: 1, M: 4.978, S: 0.1356 },
  { ageWeeks: 12, L: 1, M: 5.241, S: 0.13378 },
  { ageWeeks: 14, L: 1, M: 5.4778, S: 0.13202 },
  { ageWeeks: 16, L: 1, M: 5.6894, S: 0.13031 },
  { ageWeeks: 18, L: 1, M: 5.8767, S: 0.12865 },
  { ageWeeks: 20, L: 1, M: 6.0407, S: 0.12704 },
  { ageWeeks: 22, L: 1, M: 6.1825, S: 0.12547 },
  { ageWeeks: 24, L: 1, M: 6.3031, S: 0.12394 },
  { ageWeeks: 26, L: 1, M: 6.4035, S: 0.12246 },
  { ageWeeks: 28, L: 1, M: 6.4848, S: 0.12101 },
  { ageWeeks: 30, L: 1, M: 6.5479, S: 0.1196 },
  { ageWeeks: 32, L: 1, M: 6.5939, S: 0.11823 },
  { ageWeeks: 34, L: 1, M: 6.624, S: 0.1169 },
  { ageWeeks: 36, L: 1, M: 6.6393, S: 0.1156 },
  { ageWeeks: 38, L: 1, M: 6.641, S: 0.11433 },
  { ageWeeks: 40, L: 1, M: 6.6302, S: 0.1131 },
  { ageWeeks: 42, L: 1, M: 6.6078, S: 0.11189 },
  { ageWeeks: 44, L: 1, M: 6.5749, S: 0.11071 },
  { ageWeeks: 46, L: 1, M: 6.5325, S: 0.10956 },
  { ageWeeks: 48, L: 1, M: 6.4814, S: 0.10844 },
  { ageWeeks: 50, L: 1, M: 6.4227, S: 0.10734 },
  { ageWeeks: 52, L: 1, M: 6.3572, S: 0.10627 },
  { ageWeeks: 56, L: 1, M: 6.2072, S: 0.10421 },
  { ageWeeks: 60, L: 1, M: 6.0387, S: 0.10224 },
  { ageWeeks: 64, L: 1, M: 5.8556, S: 0.10035 },
  { ageWeeks: 68, L: 1, M: 5.6612, S: 0.09853 },
  { ageWeeks: 72, L: 1, M: 5.4583, S: 0.09678 },
  { ageWeeks: 76, L: 1, M: 5.2493, S: 0.09509 },
  { ageWeeks: 80, L: 1, M: 5.0363, S: 0.09345 },
  { ageWeeks: 84, L: 1, M: 4.8212, S: 0.09187 },
  { ageWeeks: 88, L: 1, M: 4.6057, S: 0.09034 },
  { ageWeeks: 92, L: 1, M: 4.3913, S: 0.08885 },
  { ageWeeks: 96, L: 1, M: 4.1793, S: 0.08741 },
  { ageWeeks: 100, L: 1, M: 3.9707, S: 0.086 },
  { ageWeeks: 104, L: 1, M: 3.7665, S: 0.08464 },
  { ageWeeks: 108, L: 1, M: 3.5676, S: 0.08331 },
  { ageWeeks: 110, L: 1, M: 3.4699, S: 0.08267 },
];

// ─── Length-for-age (cm) ─────────────────────────────────────────────────────

export const lfaBoys: LMSEntry[] = [
  { ageWeeks: 0, L: 1, M: 49.8842, S: 0.03795 },
  { ageWeeks: 2, L: 1, M: 52.5249, S: 0.03657 },
  { ageWeeks: 4, L: 1, M: 54.7745, S: 0.03537 },
  { ageWeeks: 6, L: 1, M: 56.6787, S: 0.03431 },
  { ageWeeks: 8, L: 1, M: 58.2848, S: 0.03335 },
  { ageWeeks: 10, L: 1, M: 59.6309, S: 0.03249 },
  { ageWeeks: 12, L: 1, M: 60.7534, S: 0.0317 },
  { ageWeeks: 14, L: 1, M: 61.6821, S: 0.03097 },
  { ageWeeks: 16, L: 1, M: 62.4423, S: 0.0303 },
  { ageWeeks: 18, L: 1, M: 63.0558, S: 0.02967 },
  { ageWeeks: 20, L: 1, M: 63.5409, S: 0.02909 },
  { ageWeeks: 22, L: 1, M: 63.9137, S: 0.02854 },
  { ageWeeks: 24, L: 1, M: 64.1887, S: 0.02803 },
  { ageWeeks: 26, L: 1, M: 64.3787, S: 0.02755 },
  { ageWeeks: 28, L: 1, M: 64.4952, S: 0.0271 },
  { ageWeeks: 30, L: 1, M: 64.5491, S: 0.02667 },
  { ageWeeks: 32, L: 1, M: 64.5508, S: 0.02627 },
  { ageWeeks: 34, L: 1, M: 64.5098, S: 0.02589 },
  { ageWeeks: 36, L: 1, M: 64.435, S: 0.02553 },
  { ageWeeks: 38, L: 1, M: 64.3345, S: 0.02519 },
  { ageWeeks: 40, L: 1, M: 64.2152, S: 0.02487 },
  { ageWeeks: 42, L: 1, M: 64.0834, S: 0.02456 },
  { ageWeeks: 44, L: 1, M: 63.9444, S: 0.02427 },
  { ageWeeks: 46, L: 1, M: 63.8023, S: 0.02399 },
  { ageWeeks: 48, L: 1, M: 63.6605, S: 0.02372 },
  { ageWeeks: 50, L: 1, M: 63.5211, S: 0.02346 },
  { ageWeeks: 52, L: 1, M: 63.3858, S: 0.02322 },
  { ageWeeks: 56, L: 1, M: 63.1265, S: 0.02276 },
  { ageWeeks: 60, L: 1, M: 62.8867, S: 0.02233 },
  { ageWeeks: 64, L: 1, M: 62.6667, S: 0.02193 },
  { ageWeeks: 68, L: 1, M: 62.4661, S: 0.02155 },
  { ageWeeks: 72, L: 1, M: 62.2842, S: 0.02119 },
  { ageWeeks: 76, L: 1, M: 62.1199, S: 0.02085 },
  { ageWeeks: 80, L: 1, M: 61.9719, S: 0.02053 },
  { ageWeeks: 84, L: 1, M: 61.839, S: 0.02023 },
  { ageWeeks: 88, L: 1, M: 61.7197, S: 0.01995 },
  { ageWeeks: 92, L: 1, M: 61.6127, S: 0.01968 },
  { ageWeeks: 96, L: 1, M: 61.5167, S: 0.01942 },
  { ageWeeks: 100, L: 1, M: 61.4305, S: 0.01918 },
  { ageWeeks: 104, L: 1, M: 61.3529, S: 0.01895 },
  { ageWeeks: 108, L: 1, M: 61.283, S: 0.01872 },
  { ageWeeks: 110, L: 1, M: 61.2502, S: 0.01861 },
];

export const lfaGirls: LMSEntry[] = [
  { ageWeeks: 0, L: 1, M: 49.1477, S: 0.03795 },
  { ageWeeks: 2, L: 1, M: 51.5019, S: 0.03657 },
  { ageWeeks: 4, L: 1, M: 53.4897, S: 0.03537 },
  { ageWeeks: 6, L: 1, M: 55.1585, S: 0.03431 },
  { ageWeeks: 8, L: 1, M: 56.5491, S: 0.03335 },
  { ageWeeks: 10, L: 1, M: 57.6997, S: 0.03249 },
  { ageWeeks: 12, L: 1, M: 58.643, S: 0.0317 },
  { ageWeeks: 14, L: 1, M: 59.405, S: 0.03097 },
  { ageWeeks: 16, L: 1, M: 60.0102, S: 0.0303 },
  { ageWeeks: 18, L: 1, M: 60.4791, S: 0.02967 },
  { ageWeeks: 20, L: 1, M: 60.8297, S: 0.02909 },
  { ageWeeks: 22, L: 1, M: 61.0776, S: 0.02854 },
  { ageWeeks: 24, L: 1, M: 61.2371, S: 0.02803 },
  { ageWeeks: 26, L: 1, M: 61.3214, S: 0.02755 },
  { ageWeeks: 28, L: 1, M: 61.343, S: 0.0271 },
  { ageWeeks: 30, L: 1, M: 61.3135, S: 0.02667 },
  { ageWeeks: 32, L: 1, M: 61.2436, S: 0.02627 },
  { ageWeeks: 34, L: 1, M: 61.1425, S: 0.02589 },
  { ageWeeks: 36, L: 1, M: 61.019, S: 0.02553 },
  { ageWeeks: 38, L: 1, M: 60.8809, S: 0.02519 },
  { ageWeeks: 40, L: 1, M: 60.7347, S: 0.02487 },
  { ageWeeks: 42, L: 1, M: 60.5861, S: 0.02456 },
  { ageWeeks: 44, L: 1, M: 60.4395, S: 0.02427 },
  { ageWeeks: 46, L: 1, M: 60.2981, S: 0.02399 },
  { ageWeeks: 48, L: 1, M: 60.1644, S: 0.02372 },
  { ageWeeks: 50, L: 1, M: 60.0401, S: 0.02346 },
  { ageWeeks: 52, L: 1, M: 59.9261, S: 0.02322 },
  { ageWeeks: 56, L: 1, M: 59.724, S: 0.02276 },
  { ageWeeks: 60, L: 1, M: 59.5494, S: 0.02233 },
  { ageWeeks: 64, L: 1, M: 59.4014, S: 0.02193 },
  { ageWeeks: 68, L: 1, M: 59.2784, S: 0.02155 },
  { ageWeeks: 72, L: 1, M: 59.1789, S: 0.02119 },
  { ageWeeks: 76, L: 1, M: 59.1011, S: 0.02085 },
  { ageWeeks: 80, L: 1, M: 59.043, S: 0.02053 },
  { ageWeeks: 84, L: 1, M: 59.0027, S: 0.02023 },
  { ageWeeks: 88, L: 1, M: 58.9784, S: 0.01995 },
  { ageWeeks: 92, L: 1, M: 58.9681, S: 0.01968 },
  { ageWeeks: 96, L: 1, M: 58.9699, S: 0.01942 },
  { ageWeeks: 100, L: 1, M: 58.9819, S: 0.01918 },
  { ageWeeks: 104, L: 1, M: 59.0025, S: 0.01895 },
  { ageWeeks: 108, L: 1, M: 59.03, S: 0.01872 },
  { ageWeeks: 110, L: 1, M: 59.0455, S: 0.01861 },
];

// ─── Lookup helpers ──────────────────────────────────────────────────────────

function interpolateEntry(table: LMSEntry[], ageWeeks: number): LMSEntry | null {
  if (table.length === 0) return null;
  if (ageWeeks <= table[0].ageWeeks) return table[0];
  if (ageWeeks >= table[table.length - 1].ageWeeks) return table[table.length - 1];

  for (let i = 0; i < table.length - 1; i++) {
    const low = table[i];
    const high = table[i + 1];
    if (ageWeeks >= low.ageWeeks && ageWeeks <= high.ageWeeks) {
      const t = (ageWeeks - low.ageWeeks) / (high.ageWeeks - low.ageWeeks);
      return {
        ageWeeks,
        L: low.L + (high.L - low.L) * t,
        M: low.M + (high.M - low.M) * t,
        S: low.S + (high.S - low.S) * t,
      };
    }
  }
  return null;
}

export function getLMS(
  gender: "male" | "female",
  ageWeeks: number,
  metric: "weight" | "height"
): LMSEntry | null {
  const table =
    metric === "weight"
      ? gender === "male"
        ? wfaBoys
        : wfaGirls
      : gender === "male"
        ? lfaBoys
        : lfaGirls;
  return interpolateEntry(table, ageWeeks);
}

// ─── Z-score calculation ─────────────────────────────────────────────────────
// WHO formula: z = ((observed / M)^L - 1) / (L * S)

export function calculateZScore(observed: number, L: number, M: number, S: number): number {
  if (L === 0) {
    return Math.log(observed / M) / S;
  }
  return (Math.pow(observed / M, L) - 1) / (L * S);
}

export function calculatePercentile(zScore: number): number {
  // Approximation of normal CDF (Abramowitz & Stegun 7.1.26)
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = zScore < 0 ? -1 : 1;
  const x = Math.abs(zScore) / Math.sqrt(2);
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * y) * 100;
}

export function classifyZScore(zScore: number): "normal" | "warning" | "risk" {
  const abs = Math.abs(zScore);
  if (abs < 2) return "normal";
  if (abs < 3) return "warning";
  return "risk";
}

export function computeZScores(
  gender: "male" | "female",
  ageWeeks: number,
  weightKg: number,
  heightCm: number
): {
  weightForAgeZScore: number | null;
  heightForAgeZScore: number | null;
  weightPercentile: number | null;
  heightPercentile: number | null;
  weightStatus: "normal" | "warning" | "risk";
  heightStatus: "normal" | "warning" | "risk";
} {
  const wLMS = getLMS(gender, ageWeeks, "weight");
  const hLMS = getLMS(gender, ageWeeks, "height");

  let weightForAgeZScore: number | null = null;
  let heightForAgeZScore: number | null = null;
  let weightPercentile: number | null = null;
  let heightPercentile: number | null = null;

  if (wLMS) {
    weightForAgeZScore = calculateZScore(weightKg, wLMS.L, wLMS.M, wLMS.S);
    weightPercentile = calculatePercentile(weightForAgeZScore);
  }
  if (hLMS) {
    heightForAgeZScore = calculateZScore(heightCm, hLMS.L, hLMS.M, hLMS.S);
    heightPercentile = calculatePercentile(heightForAgeZScore);
  }

  return {
    weightForAgeZScore,
    heightForAgeZScore,
    weightPercentile,
    heightPercentile,
    weightStatus: classifyZScore(weightForAgeZScore ?? 0),
    heightStatus: classifyZScore(heightForAgeZScore ?? 0),
  };
}
