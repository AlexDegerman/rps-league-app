import HellfireConfetti from '../confetti/HellfireConfetti'
import LunarConfetti from '../confetti/LunarConfetti'
import ElectricConfetti from '../confetti/ElectricConfetti'
import CardsConfetti from '../confetti/CardsConfetti'

type ConfettiType =
  | 'normal'
  | 'hellfire'
  | 'lunar'
  | 'electric'
  | 'cards'
  | 'fever'
  | 'inferno'

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
    default:
      return null
  }
}