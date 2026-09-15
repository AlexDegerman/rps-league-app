import { RelicDef, LoadoutType } from '@/types/relics'

export function findFirstEmptySlot(slots: (RelicDef | null)[]): number {
  return slots.findIndex((s) => s === null)
}

export async function tryAutoEquipRelic({
  relic,
  slots,
  loadout,
  equipRelic,
  onAutoEquipped,
  onPromptReplace
}: {
  relic: RelicDef
  slots: (RelicDef | null)[]
  loadout: LoadoutType
  equipRelic: (
    relic: RelicDef,
    slotIndex: number,
    loadout: LoadoutType
  ) => Promise<void> | void
  onAutoEquipped?: (slotIndex: number) => void
  onPromptReplace: () => void
}): Promise<boolean> {
  const emptyIndex = findFirstEmptySlot(slots)
  if (emptyIndex !== -1) {
    await equipRelic(relic, emptyIndex, loadout)
    onAutoEquipped?.(emptyIndex)
    return true
  }
  onPromptReplace()
  return false
}
