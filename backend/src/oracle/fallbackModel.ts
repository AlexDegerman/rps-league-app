import { GoogleGenerativeAI } from '@google/generative-ai'
import { logger } from '../utils/logger.js'
import { buildSystemInstruction } from './prompt.js'

// Module-level: one genAI instance shared across all requests
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

const MODEL_FALLBACK_CHAIN = [
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
  'gemini-2.0-flash-exp'
] as const

export async function generateWithFallback(
  query: string,
  contextString: string
): Promise<string> {
  for (const modelName of MODEL_FALLBACK_CHAIN) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: buildSystemInstruction(contextString)
      })
      const result = await model.generateContent(query)
      return result.response.text()
    } catch (err: any) {
      logger.warn('Oracle model failed', {
        model: modelName,
        error: err.message
      })
      // Only retry on capacity errors; propagate all others immediately
      if (err.message.includes('503') || err.message.includes('429')) continue
      throw err
    }
  }
  throw new Error('All Oracle nodes are currently unresponsive.')
}
