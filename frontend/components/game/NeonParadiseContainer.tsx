'use client'

import { useEffect, useState, useRef } from 'react'
import { useGameStore } from '../../app/stores/gameStore'
import { useUserStore } from '../../app/stores/userStore'
import { formatPoints, getDisplayTierClass } from '../../lib/format'
import { useSound } from '../../hooks/useSound'
import { NeonSoundContext } from '../../hooks/useNeonSound'
import type { NeonSoundAPI } from '../../hooks/useNeonSound'
import { useAnimatedBigIntVal } from '@/hooks/useAnimatedBigInt'
import GemIcon from '@/components/icons/GemIcon'
import SoundControlButton from '@/components/ui/SoundControlButton'

import TreasureVaultStage from '../bonusStages/TreasureVaultStage'
import KingsVaultStage from '../bonusStages/KingsVaultStage'
import DoubleDownStage from '../bonusStages/DoubleDownStage'
import WildPredictionStage from '../bonusStages/WildPredictionStage'
import SurgeFrenzyStage from '../bonusStages/SurgeFrenzyStage'
import RainbowRushStage from '../bonusStages/RainbowRushStage'
import SniperChallengeStage from '../bonusStages/SniperChallengeStage'
import OracleVisionStage from '../bonusStages/OracleVisionStage'
import CrystalMineStage from '../bonusStages/CrystalMineStage'

export default function NeonParadiseContainer() {
  const isBonusActive = useGameStore((s) => s.isBonusActive)
  const stylePreference = useUserStore((s) => s.stylePreference)
  const {
    initNeonAudio,
    playNeonClick,
    playNeonReward,
    playNeonShimmer,
    playNeonComplete,
    playLayer,
    playLoss,
    playCards,
    playElectric,
    playChain
  } = useSound()

  useEffect(() => {
    initNeonAudio()
  }, [initNeonAudio])

  const soundApi: NeonSoundAPI = {
    playNeonClick,
    playNeonReward,
    playNeonShimmer,
    playNeonComplete: (isMaxPayout: boolean) => {
      // Suppress the initial fanfare if Heart of the Strip is about to duplicate
      if (isMaxPayout && useGameStore.getState().bonusHeartProc) return
      playNeonComplete(isMaxPayout)
    },
    playLayer,
    playLoss,
    playCards,
    playElectric: () => playElectric(),
    playChain
  }

  const activeBonusStage = useGameStore((s) => s.activeBonusStage)
  const accumulatedBonusReward = useGameStore((s) => s.accumulatedBonusReward)
  const bonusFinalPayout = useGameStore((s) => s.bonusFinalPayout)
  const bonusBasePayout = useGameStore((s) => s.bonusBasePayout)
  const bonusHeartProc = useGameStore((s) => s.bonusHeartProc)
  const bonusCompletionMetric = useGameStore((s) => s.bonusCompletionMetric)
  const bonusLastBet = useGameStore((s) => s.bonusLastBet)
  const clearBonusState = useGameStore((s) => s.clearBonusState)

  const [slamPhase, setSlamPhase] = useState<
    'idle' | 'slam' | 'counting' | 'done'
  >('idle')
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const isHeartActive = Boolean(bonusHeartProc && bonusBasePayout)
  const isButtonBlocked = isHeartActive && slamPhase !== 'done'
  const isShaking = slamPhase === 'slam'
  const isTwentyX = slamPhase === 'counting' || slamPhase === 'done'

  const currentTarget =
    isHeartActive && (slamPhase === 'idle' || slamPhase === 'slam')
      ? bonusBasePayout!
      : (bonusFinalPayout ?? 0n)

  useEffect(() => {
    if (!bonusFinalPayout || !bonusHeartProc || !bonusBasePayout) {
      return
    }

    const t1 = setTimeout(() => {
      setSlamPhase('slam')
      playChain(['slam', 'cascade', 'fanfare'])

      const t2 = setTimeout(() => {
        setSlamPhase('counting')

        const t3 = setTimeout(() => {
          setSlamPhase('done')
        }, 1400)
        timersRef.current.push(t3)
      }, 400)
      timersRef.current.push(t2)
    }, 1300)
    timersRef.current.push(t1)

    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
  }, [bonusFinalPayout, bonusHeartProc, bonusBasePayout, playChain])

  const animatedResult = useAnimatedBigIntVal(
    currentTarget,
    slamPhase === 'counting' ? 1200 : 1000,
    slamPhase === 'idle'
  )

  const handleCollect = () => {
    setSlamPhase('idle')
    clearBonusState()
  }

  const activePayout = isTwentyX
    ? bonusFinalPayout
    : (bonusBasePayout ?? bonusFinalPayout)

  const formattedMultiplier =
    Number(bonusLastBet) > 0 && activePayout !== null
      ? (Number(activePayout) / Number(bonusLastBet))
          .toFixed(1)
          .replace(/\.0$/, '')
      : null

  if (!isBonusActive || !activeBonusStage) return null

  return (
    <NeonSoundContext.Provider value={soundApi}>
      <div
        className={`w-full bg-white border border-slate-200 rounded-3xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.05)] flex flex-col items-center p-6 pt-3! relative animate-[np-fade-in_0.3s_ease-out_forwards] ${
          isShaking ? 'animate-light-shake' : ''
        }`}
      >
        <div className="w-full flex items-center justify-between gap-2 text-center pb-3 border-b border-slate-100 mb-4">
          <div
            className="hidden sm:block w-10.5 shrink-0 invisible"
            aria-hidden="true"
          />

          <div className="text-xl font-[850] tracking-wider text-indigo-600 whitespace-nowrap sm:text-center">
            🌴 NEON PARADISE
          </div>

          <SoundControlButton />
        </div>

        {/* Status bar */}
        {activeBonusStage === 'ORACLE_VISION' && !bonusFinalPayout && (
          <div className="w-full flex justify-between items-center px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl mb-6">
            <span className="text-[0.78rem] text-slate-500 font-bold uppercase tracking-wider">
              Current Reward:{' '}
              <span className="text-green-600 font-extrabold ml-1">
                {formatPoints(accumulatedBonusReward).display}
              </span>
            </span>
          </div>
        )}

        {bonusFinalPayout !== null ? (
          <div className="flex flex-col items-center gap-6 py-6 w-full animate-in zoom-in slide-in-from-bottom-4 duration-500 relative">
            {(slamPhase === 'slam' || slamPhase === 'counting') && (
              <div className="absolute -top-3 z-50 pointer-events-none flex flex-col items-center">
                <span className="slam-drop-in rainbow-slam-text text-7xl sm:text-8xl select-none">
                  x2
                </span>
              </div>
            )}

            <div className="flex flex-col items-center text-center gap-1.5">
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full border shadow-sm transition-all duration-300 ${
                  isTwentyX && bonusHeartProc
                    ? 'border-purple-200 bg-purple-50/70'
                    : 'border-violet-100 bg-violet-50/50'
                }`}
              >
                <span className="text-[10px] font-black tracking-widest text-violet-600 leading-none">
                  {activeBonusStage
                    .toLowerCase()
                    .split('_')
                    .map(
                      (word: string) =>
                        word.charAt(0).toUpperCase() + word.slice(1)
                    )
                    .join(' ')}
                </span>
                <span className="text-violet-300 mx-1.5 leading-none">·</span>
                <span
                  className={`text-[10px] font-black uppercase tracking-widest leading-none ${
                    isTwentyX && bonusHeartProc
                      ? 'text-purple-600 font-black'
                      : 'text-violet-500'
                  }`}
                >
                  {bonusHeartProc && isTwentyX
                    ? `${formattedMultiplier ?? '20'}x Payout (Heart of the Strip)!`
                    : formattedMultiplier
                      ? `${formattedMultiplier}x Payout`
                      : 'BONUS WIN'}
                </span>
              </div>
              {bonusCompletionMetric && (
                <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-indigo-500/85 mt-1 select-none duration-1000">
                  {bonusCompletionMetric}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <GemIcon size={28} />
              <span className="text-4xl sm:text-5xl font-black tabular-nums tracking-tighter text-green-500">
                +
              </span>
              <span
                className={`text-4xl sm:text-5xl font-black tabular-nums tracking-tighter ${getDisplayTierClass(animatedResult, stylePreference)}`}
              >
                {formatPoints(animatedResult).display}
              </span>
            </div>

            <button
              onClick={handleCollect}
              disabled={isButtonBlocked}
              className={`stage-claim-btn mt-2 shadow-lg transition-all ${
                isButtonBlocked
                  ? 'opacity-50 cursor-not-allowed filter grayscale'
                  : 'hover:brightness-110 active:scale-95'
              }`}
            >
              Collect Reward
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            {activeBonusStage === 'TREASURE_VAULT' && <TreasureVaultStage />}
            {activeBonusStage === 'KINGS_VAULT' && <KingsVaultStage />}
            {activeBonusStage === 'DOUBLE_DOWN' && <DoubleDownStage />}
            {activeBonusStage === 'WILD_PREDICTION' && <WildPredictionStage />}
            {activeBonusStage === 'SURGE_FRENZY' && <SurgeFrenzyStage />}
            {activeBonusStage === 'RAINBOW_RUSH' && <RainbowRushStage />}
            {activeBonusStage === 'SNIPER_CHALLENGE' && (
              <SniperChallengeStage />
            )}
            {activeBonusStage === 'ORACLE_VISION' && <OracleVisionStage />}
            {activeBonusStage === 'CRYSTAL_MINE' && <CrystalMineStage />}
          </div>
        )}
      </div>
    </NeonSoundContext.Provider>
  )
}
