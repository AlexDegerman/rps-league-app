import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import CrystalMineStage from '@/components/bonusStages/CrystalMineStage'
import DoubleDownStage from '@/components/bonusStages/DoubleDownStage'
import KingsVaultStage from '@/components/bonusStages/KingsVaultStage'
import OracleVisionStage from '@/components/bonusStages/OracleVisionStage'
import RainbowRushStage from '@/components/bonusStages/RainbowRushStage'
import SniperChallengeStage from '@/components/bonusStages/SniperChallengeStage'
import SurgeFrenzyStage from '@/components/bonusStages/SurgeFrenzyStage'
import TreasureVaultStage from '@/components/bonusStages/TreasureVaultStage'
import WildPredictionStage from '@/components/bonusStages/WildPredictionStage'

const mockGameStoreState = {
  bonusGridState: null,
  bonusLastBet: 1000n,
  updateBonusReward: vi.fn(),
  setBonusFinalPayout: vi.fn()
}

vi.mock('../../app/stores/gameStore', () => ({
  useGameStore: vi.fn((selector) => selector(mockGameStoreState))
}))

vi.mock('../../lib/api', () => ({
  postBonusAction: vi.fn().mockResolvedValue({}),
  claimBonusWinnings: vi.fn().mockResolvedValue({})
}))

vi.mock('../../lib/user', () => ({
  getOrCreateUser: vi.fn().mockReturnValue({ userId: 'mock-user-id' })
}))

vi.mock('../../hooks/useNeonSound', () => ({
  useNeonSound: vi.fn().mockReturnValue({
    playNeonClick: vi.fn(),
    playNeonShimmer: vi.fn(),
    playNeonReward: vi.fn(),
    playNeonComplete: vi.fn(),
    playLoss: vi.fn(),
    playLayer: vi.fn(),
    playChain: vi.fn(),
    playElectric: vi.fn(),
    playCards: vi.fn()
  })
}))

vi.mock('../../lib/format', () => ({
  formatPoints: vi.fn((val) => ({ display: `${val} Points` }))
}))

describe('Bonus Stages Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders CrystalMineStage', () => {
    render(<CrystalMineStage />)
    expect(screen.getByText(/CRYSTAL MINE/i)).toBeInTheDocument()
  })

  it('renders DoubleDownStage', () => {
    render(<DoubleDownStage />)
    expect(screen.getAllByText(/Double Down/i)[0]).toBeInTheDocument()
  })

  it('renders KingsVaultStage', () => {
    render(<KingsVaultStage />)
    expect(screen.getByText(/KING'S VAULT/i)).toBeInTheDocument()
  })

  it('renders OracleVisionStage', () => {
    render(<OracleVisionStage />)
    expect(screen.getByText(/ARKALON VISION/i)).toBeInTheDocument()
  })

  it('renders RainbowRushStage', () => {
    render(<RainbowRushStage />)
    expect(screen.getByText(/RAINBOW RUSH/i)).toBeInTheDocument()
  })

  it('renders SniperChallengeStage', async () => {
    render(<SniperChallengeStage />)

    expect(screen.getByText(/SNIPER CHALLENGE/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /FIRE/i })).toBeEnabled()
    })
  })

  it('renders SurgeFrenzyStage', () => {
    render(<SurgeFrenzyStage />)
    expect(screen.getByText(/SURGE FRENZY/i)).toBeInTheDocument()
  })

  it('renders TreasureVaultStage', () => {
    render(<TreasureVaultStage />)
    expect(screen.getByText(/TREASURE VAULT/i)).toBeInTheDocument()
  })

  it('renders WildPredictionStage', () => {
    render(<WildPredictionStage />)
    expect(screen.getByText(/WILD PREDICTION/i)).toBeInTheDocument()
  })
})
