export type ActivityType =
  | 'relic'
  | 'achievement'
  | 'festival'
  | 'global_event'
  | 'streak'
  | 'world_boss_hit'

export interface ActivityBroadcast {
  id: string
  type: ActivityType
  userId: string
  nickname: string
  payload: Record<string, unknown>
  timestamp: number
}

const _buffer: ActivityBroadcast[] = []

export const emitActivity = (event: ActivityBroadcast): void => {
  _buffer.push(event)
}

export const drainActivities = (): ActivityBroadcast[] =>
  _buffer.splice(0, _buffer.length)
