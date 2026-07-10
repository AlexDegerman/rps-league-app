export interface FormattedResponse {
  result: string
  source: string
}

export function formatResponse(responseText: string): FormattedResponse {
  const sourceMatch = responseText.match(/\[SOURCE:\s*(.*?)\]/)
  const source = sourceMatch?.[1] ?? 'league_telemetry'
  const stripped = responseText.replace(/\[SOURCE:.*?\]/, '').trim()

  // game_knowledge responses may use up to 3 sentences to avoid omitting critical rules
  const maxSentences = source === 'game_knowledge' ? 3 : 2
  const sentences = stripped.match(/[^.!?]+[.!?]+/g)
  const result =
    sentences && sentences.length > maxSentences
      ? sentences.slice(0, maxSentences).join('').trim()
      : stripped

  return { result, source }
}
