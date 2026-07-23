// Temporary buffer for World Boss burst events between producers and consumers.

export interface BurstEvent {
  userId: string
  nickname: string
  damage: number
}

const _buffer: BurstEvent[] = []

export const pushBurstEvent = (e: BurstEvent): void => {
  _buffer.push(e)
}
export const drainBurstEvents = (): BurstEvent[] =>
  _buffer.splice(0, _buffer.length)
