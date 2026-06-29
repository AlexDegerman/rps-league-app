import { FestivalType } from '@/types/rps'

export type Side = 'left' | 'right'

export type OracleMessage = {
  prefix: string
  suffix: string
  side: Side
  sideClass: string
  speech: string
}

const baseSideClass = {
  left: 'font-black px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.4)] uppercase tracking-wider',
  right:
    'font-black px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.4)] uppercase tracking-wider'
}

const altSideClass = {
  left: 'font-black px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-200 shadow-[0_0_12px_rgba(139,92,246,0.45)] uppercase tracking-wider',
  right:
    'font-black px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-200 shadow-[0_0_10px_rgba(14,165,233,0.4)] uppercase tracking-wider'
}

export const oracleTemplates = [
  (side: Side): OracleMessage => ({
    prefix: '👁️ Daily Oracle Prophecy: System equilibrium has fractured. The',
    suffix: 'side is locked for the next match outcome.',
    side,
    sideClass: baseSideClass[side],
    speech: `System equilibrium fractured. ${side} side locked.`
  }),

  (side: Side): OracleMessage => ({
    prefix:
      '👁️ Daily Oracle Prophecy: Historical simulation layers have stabilized. The',
    suffix: 'side holds a fully resolved 100% outcome path.',
    side,
    sideClass: altSideClass[side],
    speech: `Simulation stabilized. ${side} side holds a fully resolved outcome.`
  }),

  (side: Side): OracleMessage => ({
    prefix:
      '👁️ Daily Oracle Prophecy: Predictive telemetry convergence complete. The',
    suffix: 'side is designated as the only valid result branch.',
    side,
    sideClass: baseSideClass[side],
    speech: `Telemetry convergence complete. ${side} side is the only valid branch.`
  }),

  (side: Side): OracleMessage => ({
    prefix: '👁️ Daily Oracle Prophecy: System vectors fully aligned. The',
    suffix: 'side overrides all competing probability states.',
    side,
    sideClass: altSideClass[side],
    speech: `Vectors aligned. ${side} side overrides all probability states.`
  }),

  (side: Side): OracleMessage => ({
    prefix:
      '👁️ Daily Oracle Prophecy: Quantum probability collapse finalized. The',
    suffix: 'side is the deterministic outcome of this cycle.',
    side,
    sideClass: baseSideClass[side],
    speech: `Probability collapse finalized. ${side} side is the deterministic outcome.`
  }),

  (side: Side): OracleMessage => ({
    prefix:
      '👁️ Daily Oracle Prophecy: Chrono-stream stabilization complete. The',
    suffix: 'side governs the next resolution window.',
    side,
    sideClass: altSideClass[side],
    speech: `Chrono-stream stable. ${side} side governs the next resolution window.`
  }),

  (side: Side): OracleMessage => ({
    prefix:
      '👁️ Daily Oracle Prophecy: Predictive engine has eliminated variance. The',
    suffix: 'side is mathematically inevitable.',
    side,
    sideClass: baseSideClass[side],
    speech: `Variance eliminated. ${side} side is mathematically inevitable.`
  }),

  (side: Side): OracleMessage => ({
    prefix: '👁️ Daily Oracle Prophecy: Thermal convergence detected. The',
    suffix: 'side will dominate the next match sequence.',
    side,
    sideClass: altSideClass[side],
    speech: `Thermal convergence detected. ${side} side will dominate.`
  }),

  (side: Side): OracleMessage => ({
    prefix: '👁️ Daily Oracle Prophecy: Signal integrity locked. The',
    suffix: 'side is confirmed for total victory.',
    side,
    sideClass: baseSideClass[side],
    speech: `Signal integrity locked. ${side} side confirmed for total victory.`
  }),

  (side: Side): OracleMessage => ({
    prefix: '👁️ Daily Oracle Prophecy: Simulation has already resolved. The',
    suffix: 'side emerges as the final outcome.',
    side,
    sideClass: altSideClass[side],
    speech: `Simulation resolved. ${side} side is the final outcome.`
  }),

  (side: Side): OracleMessage => ({
    prefix: '👁️ Daily Oracle Prophecy: Pattern recursion collapse favors the',
    suffix: 'side as all opposing branches terminate.',
    side,
    sideClass: baseSideClass[side],
    speech: `Pattern recursion collapsed. ${side} side favored as all branches terminate.`
  }),

  (side: Side): OracleMessage => ({
    prefix:
      '👁️ Daily Oracle Prophecy: Neural telemetry confirms dominance of the',
    suffix: 'side trajectory in the current cycle.',
    side,
    sideClass: altSideClass[side],
    speech: `Neural telemetry confirms ${side} side dominance this cycle.`
  }),

  (side: Side): OracleMessage => ({
    prefix: '👁️ Daily Oracle Prophecy: Predictive noise eliminated. The',
    suffix: 'side is the only stable outcome state.',
    side,
    sideClass: baseSideClass[side],
    speech: `Predictive noise eliminated. ${side} side is the only stable state.`
  }),

  (side: Side): OracleMessage => ({
    prefix:
      '👁️ Daily Oracle Prophecy: Tactical variance inversion complete. The',
    suffix: 'side now controls the result stream.',
    side,
    sideClass: altSideClass[side],
    speech: `Variance inversion complete. ${side} side controls the result stream.`
  }),

  (side: Side): OracleMessage => ({
    prefix: '👁️ Daily Oracle Prophecy: Probability lattice locked. The',
    suffix: 'side cannot fail this cycle.',
    side,
    sideClass: baseSideClass[side],
    speech: `Probability lattice locked. ${side} side cannot fail.`
  }),

  (side: Side): OracleMessage => ({
    prefix: '👁️ Daily Oracle Prophecy: Hidden calculations resolved. The',
    suffix: 'side holds absolute certainty.',
    side,
    sideClass: altSideClass[side],
    speech: `Hidden calculations resolved. ${side} side holds absolute certainty.`
  }),

  (side: Side): OracleMessage => ({
    prefix: '👁️ Daily Oracle Prophecy: Simulation drift corrected. The',
    suffix: 'side defines the outcome stream.',
    side,
    sideClass: baseSideClass[side],
    speech: `Simulation drift corrected. ${side} side defines the outcome.`
  }),

  (side: Side): OracleMessage => ({
    prefix: '👁️ Daily Oracle Prophecy: Deterministic state achieved. The',
    suffix: 'side will prevail.',
    side,
    sideClass: altSideClass[side],
    speech: `Deterministic state achieved. ${side} side will prevail.`
  }),

  (side: Side): OracleMessage => ({
    prefix: '👁️ Daily Oracle Prophecy: Confidence threshold exceeded. The',
    suffix: 'side is fully stabilized.',
    side,
    sideClass: baseSideClass[side],
    speech: `Confidence threshold exceeded. ${side} side fully stabilized.`
  }),

  (side: Side): OracleMessage => ({
    prefix: '👁️ Daily Oracle Prophecy: Entropy collapse detected. The',
    suffix: 'side inherits the winning branch.',
    side,
    sideClass: altSideClass[side],
    speech: `Entropy collapsed. ${side} side inherits the winning branch.`
  }),

  (side: Side): OracleMessage => ({
    prefix: '👁️ Daily Oracle Prophecy: Temporal resolution complete. The',
    suffix: 'side has already secured the outcome.',
    side,
    sideClass: baseSideClass[side],
    speech: `Temporal resolution complete. ${side} side has already secured the outcome.`
  }),

  (side: Side): OracleMessage => ({
    prefix: '👁️ Daily Oracle Prophecy: Event-chain convergence complete. The',
    suffix: 'side dominates the final path.',
    side,
    sideClass: altSideClass[side],
    speech: `Event-chain converged. ${side} side dominates the final path.`
  }),

  (side: Side): OracleMessage => ({
    prefix: '👁️ Daily Oracle Prophecy: Statistical resistance has failed. The',
    suffix: 'side controls the incoming resolution.',
    side,
    sideClass: baseSideClass[side],
    speech: `Statistical resistance failed. ${side} side controls the incoming resolution.`
  }),

  (side: Side): OracleMessage => ({
    prefix:
      '👁️ Daily Oracle Prophecy: Outcome trajectory fully bends toward the',
    suffix: 'side.',
    side,
    sideClass: altSideClass[side],
    speech: `Outcome trajectory bends toward ${side} side.`
  }),

  (side: Side): OracleMessage => ({
    prefix: '👁️ Daily Oracle Prophecy: Outcome synchronization successful. The',
    suffix: 'side has achieved total alignment.',
    side,
    sideClass: baseSideClass[side],
    speech: `Synchronization successful. ${side} side has achieved total alignment.`
  }),

  (side: Side): OracleMessage => ({
    prefix: '👁️ Daily Oracle Prophecy: Predictive overflow detected. The',
    suffix: 'side exceeds all competing outcomes.',
    side,
    sideClass: altSideClass[side],
    speech: `Predictive overflow detected. ${side} side exceeds all competing outcomes.`
  }),

  (side: Side): OracleMessage => ({
    prefix: '👁️ Daily Oracle Prophecy: Calculation engine converged. The',
    suffix: 'side is the only viable result.',
    side,
    sideClass: baseSideClass[side],
    speech: `Calculation engine converged. ${side} side is the only viable result.`
  }),

  (side: Side): OracleMessage => ({
    prefix:
      '👁️ Daily Oracle Prophecy: Active simulations unanimously select the',
    suffix: 'side outcome.',
    side,
    sideClass: altSideClass[side],
    speech: `All simulations unanimous. ${side} side selected.`
  }),

  (side: Side): OracleMessage => ({
    prefix: '👁️ Daily Oracle Prophecy: Outcome recursion stabilized. The',
    suffix: 'side repeats as the victorious branch.',
    side,
    sideClass: baseSideClass[side],
    speech: `Recursion stabilized. ${side} side repeats as the victorious branch.`
  }),

  (side: Side): OracleMessage => ({
    prefix: '👁️ Daily Oracle Prophecy: Oracle vision locked. The',
    suffix: 'side holds full probability control.',
    side,
    sideClass: altSideClass[side],
    speech: `Oracle vision locked. ${side} side holds full probability control.`
  }),

  (side: Side): OracleMessage => ({
    prefix: '👁️ Daily Oracle Prophecy: Final forecasting complete. The',
    suffix: 'side terminates the cycle.',
    side,
    sideClass: baseSideClass[side],
    speech: `Final forecasting complete. ${side} side terminates the cycle.`
  })
]

export const getFestivalEffectDescription = (type: FestivalType): string => {
  const descriptions: Record<FestivalType, string> = {
    SPARK:
      'Universal synchronization achieved. All flash event state buffers restored.',
    GHOST:
      'Win Echo active. Successful predictions generate a 20% signal echo.',
    SAFEGUARD:
      'Risk Shield active. Prediction losses deduct 40% instead of 50%.',
    RESONANCE:
      'Bonus floor stabilized. Common and Rare bonuses are designated as mandatory.',
    SURGE: 'Power Surge active. Successful predictions are multiplied by 3x.',
    VAULT: 'Loot Echo active. Relic discovery rates are boosted by 100%.',
    FEVER:
      'Streak Aegis active. Prediction failures will not break active win streaks.',
    SANGUINE:
      'Absolute Correction active. All incoming predictions resolve as wins.'
  }
  return descriptions[type]
}
