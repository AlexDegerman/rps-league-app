import type { Match } from '../types/rps.js'

let matches: Match[] = []

export const getMatches = (): Match[] => matches

export const addMatch = (match: Match): void => {
  matches.unshift(match)
}

export const fetchAllMatches = async (): Promise<Match[]> => {
  return matches
}
