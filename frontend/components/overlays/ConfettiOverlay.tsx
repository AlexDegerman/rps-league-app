'use client'

import HellfireConfetti from '../confetti/HellfireConfetti'
import LunarConfetti from '../confetti/LunarConfetti'
import ElectricConfetti from '../confetti/ElectricConfetti'
import CardsConfetti from '../confetti/CardsConfetti'
import TidalSurgeConfetti from '../confetti/TidalSurgeConfetti'
import SolarFlareConfetti from '../confetti/SolarFlareConfetti'
import CycloneBlitzConfetti from '../confetti/CycloneBlitzConfetti'
import MirageCataclysmConfetti from '../confetti/MirageCataclysmConfetti'
import type { ConfettiType } from '@/types/rps'

interface ConfettiOverlayProps {
  confettiType: ConfettiType
  show: boolean
}

export default function ConfettiOverlay({
  confettiType,
  show
}: ConfettiOverlayProps) {
  if (!show) return null

  switch (confettiType) {
    case 'hellfire':
      return <HellfireConfetti />
    case 'lunar':
      return <LunarConfetti />
    case 'electric':
      return <ElectricConfetti />
    case 'cards':
      return <CardsConfetti />
    case 'tidal_surge':
      return <TidalSurgeConfetti />
    case 'solar_flare':
      return <SolarFlareConfetti />
    case 'cyclone_blitz':
      return <CycloneBlitzConfetti />
    case 'mirage_cataclysm':
      return <MirageCataclysmConfetti />
    default:
      return null
  }
}
