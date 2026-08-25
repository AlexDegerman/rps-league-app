import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import React from 'react'
import NeonParadiseContainer from '@/components/game/NeonParadiseContainer'

const mocks = vi.hoisted(() => {
  return {
    mockSound: {
      initNeonAudio: vi.fn(),
      playNeonClick: vi.fn(),
      playNeonReward: vi.fn(),
      playNeonShimmer: vi.fn(),
      playNeonComplete: vi.fn(),
      playLayer: vi.fn(),
      playLoss: vi.fn(),
      playCards: vi.fn(),
      playElectric: vi.fn(),
      playChain: vi.fn(),
      soundOn: true,
      toggleSound: vi.fn(),
      volume: 0.5,
      setVolume: vi.fn()
    },
    NeonSoundContext: {
      Provider: ({ children }: { children: React.ReactNode }) => children
    },
    gameState: {
      isBonusActive: false,
      activeBonusStage: null as string | null,
      accumulatedBonusReward: 0n,
      bonusFinalPayout: null as bigint | null,
      bonusCompletionMetric: null as string | null,
      bonusLastBet: 1000n,
      clearBonusState: vi.fn()
    },
    userStoreState: {
      stylePreference: 'default'
    },
    uiStoreState: {
      oracleVolume: 0.5,
      setOracleVolume: vi.fn()
    }
  }
})

vi.mock('@/hooks/useSound', () => ({
  useSound: () => mocks.mockSound
}))

vi.mock('@/hooks/useNeonSound', () => ({
  NeonSoundContext: mocks.NeonSoundContext
}))

vi.mock('@/app/stores/gameStore', () => ({
  useGameStore: vi.fn((selector) => selector(mocks.gameState))
}))

vi.mock('@/app/stores/userStore', () => ({
  useUserStore: vi.fn((selector) => selector(mocks.userStoreState))
}))

vi.mock('@/app/stores/uiStore', () => ({
  useUIStore: vi.fn((selector) => selector(mocks.uiStoreState))
}))

vi.mock('@/hooks/useAnimatedBigInt', () => ({
  useAnimatedBigIntVal: vi.fn((val) => val)
}))

vi.mock('@/lib/format', () => ({
  formatPoints: vi.fn((val) => ({ display: `${val} Points` })),
  getDisplayTierClass: vi.fn(() => 'tier-class')
}))

vi.mock('@/components/icons/GemIcon', () => ({
  default: () => <div data-testid="GemIcon">GemIcon</div>
}))

vi.mock('@/components/icons/SoundIcon', () => ({
  default: () => <div data-testid="SoundIcon">SoundIcon</div>
}))

vi.mock('@/components/ui/SoundControlPopover', () => ({
  default: () => (
    <div data-testid="SoundControlPopover">SoundControlPopover</div>
  )
}))

vi.mock('@/components/bonusStages/TreasureVaultStage', () => ({
  default: () => <div data-testid="TreasureVaultStage">TreasureVaultStage</div>
}))

vi.mock('@/components/bonusStages/KingsVaultStage', () => ({
  default: () => <div data-testid="KingsVaultStage">KingsVaultStage</div>
}))

vi.mock('@/components/bonusStages/DoubleDownStage', () => ({
  default: () => <div data-testid="DoubleDownStage">DoubleDownStage</div>
}))

vi.mock('@/components/bonusStages/WildPredictionStage', () => ({
  default: () => (
    <div data-testid="WildPredictionStage">WildPredictionStage</div>
  )
}))

vi.mock('@/components/bonusStages/SurgeFrenzyStage', () => ({
  default: () => <div data-testid="SurgeFrenzyStage">SurgeFrenzyStage</div>
}))

vi.mock('@/components/bonusStages/RainbowRushStage', () => ({
  default: () => <div data-testid="RainbowRushStage">RainbowRushStage</div>
}))

vi.mock('@/components/bonusStages/SniperChallengeStage', () => ({
  default: () => (
    <div data-testid="SniperChallengeStage">SniperChallengeStage</div>
  )
}))

vi.mock('@/components/bonusStages/OracleVisionStage', () => ({
  default: () => <div data-testid="OracleVisionStage">OracleVisionStage</div>
}))

vi.mock('@/components/bonusStages/CrystalMineStage', () => ({
  default: () => <div data-testid="CrystalMineStage">CrystalMineStage</div>
}))

describe('NeonParadiseContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.gameState.isBonusActive = false
    mocks.gameState.activeBonusStage = null
    mocks.gameState.accumulatedBonusReward = 0n
    mocks.gameState.bonusFinalPayout = null
    mocks.gameState.bonusCompletionMetric = null
    mocks.gameState.bonusLastBet = 1000n
    mocks.gameState.clearBonusState = vi.fn()

    mocks.userStoreState.stylePreference = 'default'

    mocks.uiStoreState.oracleVolume = 0.5
    mocks.uiStoreState.setOracleVolume = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns nothing when no bonus stage is active', () => {
    mocks.gameState.isBonusActive = false
    mocks.gameState.activeBonusStage = 'TREASURE_VAULT'

    const { container } = render(<NeonParadiseContainer />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the correct bonus stage when active', () => {
    mocks.gameState.isBonusActive = true
    mocks.gameState.activeBonusStage = 'TREASURE_VAULT'

    render(<NeonParadiseContainer />)

    expect(screen.getByText(/NEON PARADISE/i)).toBeInTheDocument()
    expect(screen.getByTestId('TreasureVaultStage')).toBeInTheDocument()
  })

  it('shows the reward screen after completion', () => {
    mocks.gameState.isBonusActive = true
    mocks.gameState.activeBonusStage = 'TREASURE_VAULT'
    mocks.gameState.bonusFinalPayout = 5000n
    mocks.gameState.bonusCompletionMetric = 'Perfect Recall!'

    render(<NeonParadiseContainer />)

    expect(screen.getByText('Perfect Recall!')).toBeInTheDocument()
    expect(screen.getByText(/5000 Points/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Collect Reward/i })
    ).toBeInTheDocument()
  })

  it('calls clearBonusState when Collect Reward is clicked', () => {
    mocks.gameState.isBonusActive = true
    mocks.gameState.activeBonusStage = 'TREASURE_VAULT'
    mocks.gameState.bonusFinalPayout = 5000n

    render(<NeonParadiseContainer />)

    const collectBtn = screen.getByRole('button', { name: /Collect Reward/i })
    fireEvent.click(collectBtn)

    expect(mocks.gameState.clearBonusState).toHaveBeenCalled()
  })
})
