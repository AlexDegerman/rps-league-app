import { getCached, setCache } from '../oracle/cache.js'
import { generateWithFallback } from '../oracle/fallbackModel.js'
import { buildContext } from '../oracle/contextBuilder.js'
import { formatResponse } from '../oracle/responseFormatter.js'
import { sendDiscordWebhook } from '../utils/discord.js'
import { logger } from '../utils/logger.js'

const REAL_MONEY_TRIGGERS = [
  'cashout',
  'withdraw',
  'withdrawal',
  'paypal',
  'bank transfer',
  'payout',
  'redeem for cash',
  'convert to real money'
] as const

const REAL_MONEY_OVERRIDE =
  'Points are strictly virtual telemetry metrics with zero physical value. They exist only for leaderboard ranking and visual tier progression.'

export interface OracleResult {
  result: string
  source: string
  cached: boolean
}

function hasRealMoneyIntent(query: string): boolean {
  const q = query.toLowerCase()
  return REAL_MONEY_TRIGGERS.some((trigger) => q.includes(trigger))
}

// Fire-and-forget — embed construction lives here, next to the data that shapes it
function logOracleConsultation(
  query: string,
  nickname: string | undefined,
  response: string
): void {
  const webhookUrl = process.env.DISCORD_LOG_WEBHOOK
  if (!webhookUrl || process.env.NODE_ENV !== 'production') return

  sendDiscordWebhook(webhookUrl, {
    title: '🔮 Oracle Consultation',
    color: 0x9b59b6,
    fields: [
      {
        name: '📥 User Prompt',
        value: `\`\`\`${query.substring(0, 1000)}\`\`\``
      },
      {
        name: '👤 Nickname',
        value: `\`${nickname ?? 'Anonymous'}\``,
        inline: true
      },
      {
        name: '⏱️ Timestamp',
        value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
        inline: true
      },
      {
        name: '📤 Oracle Response',
        value:
          response.substring(0, 1000) + (response.length > 1000 ? '...' : '')
      }
    ],
    footer: { text: 'RPS League Admin Audit' }
  }).catch((err) =>
    logger.warn('Oracle audit log failed', { error: String(err) })
  )
}

export async function consultOracle(
  query: string,
  nickname?: string
): Promise<OracleResult> {
  if (hasRealMoneyIntent(query)) {
    return {
      result: REAL_MONEY_OVERRIDE,
      source: 'system_override',
      cached: false
    }
  }

  const normalizedQuery = query.toLowerCase().trim()

  const hit = getCached(normalizedQuery)
  if (hit) {
    return { ...hit, cached: true }
  }

  const context = await buildContext()
  const rawResponse = await generateWithFallback(query, context)

  logOracleConsultation(query, nickname, rawResponse)

  const { result, source } = formatResponse(rawResponse)
  setCache(normalizedQuery, result, source)

  return { result, source, cached: false }
}
