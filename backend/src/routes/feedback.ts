import { Router } from 'express'
import type { Request, Response } from 'express'
import multer, { type FileFilterCallback } from 'multer'
import * as Sentry from '@sentry/node'
import pool from '../utils/db.js'
import rateLimit from 'express-rate-limit'
import { logger } from '../utils/logger.js'

/**
 * CONFIGURATION
 * Environment-driven webhook + admin security keys.
 */
const DISCORD_WEBHOOK_URL = process.env.DISCORD_FEEDBACK_WEBHOOK!
const ADMIN_KEY = process.env.FEEDBACK_ADMIN_KEY!
const API_BASE = process.env.API_BASE_URL || 'http://localhost:5000'

/**
 * PRODUCTION SAFETY CHECK
 * Ensures admin links are not broken in deployed environments.
 */
if (!process.env.API_BASE_URL && process.env.NODE_ENV === 'production') {
  logger.warn('API_BASE_URL is missing. Admin links may break.')
}

/**
 * CATEGORY MAPPING
 * Maps frontend categories into structured Discord embeds.
 */
const CATEGORIES: Record<string, { label: string; color: number }> = {
  bug: { label: '🐛 Technical Issue', color: 0xe74c3c },
  visuals: { label: '🎨 Visuals & Animations', color: 0x3498db },
  balance: { label: '⚖️ Gameplay & Balance', color: 0xf1c40f },
  oracle: { label: '👁️ AI Oracle Analysis', color: 0x9b59b6 },
  suggestion: { label: '💡 Suggestion', color: 0x34495e },
  praise: { label: '🙌 General Praise', color: 0x2ecc71 }
}

/**
 * UPLOAD HANDLING
 * In-memory storage for screenshots (max 5MB, images only).
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) => {
    cb(null, file.mimetype.startsWith('image/'))
  }
})

/**
 * IP EXTRACTION
 * Normalizes proxy + socket IP sources into a consistent format.
 */
const getSafeIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) {
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]
    return ip?.trim() || 'anonymous'
  }
  return req.socket?.remoteAddress ?? 'anonymous'
}

const feedbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getSafeIp(req),
  handler: (_req, res) => {
    res.status(429).json({ error: 'RATE_LIMITED' })
  }
})

const router = Router()

/**
 * IP MASKING
 * Privacy-safe representation supporting IPv4 and IPv6.
 */
const maskIp = (ip: string): string => {
  if (!ip || ip === 'unknown' || ip === 'anonymous') return 'anonymous'

  // IPv4
  if (ip.includes('.') && !ip.includes(':')) {
    const parts = ip.split('.')
    return parts.length >= 2 ? `${parts[0]}.${parts[1]}.x.x` : ip
  }

  // IPv6 localhost shortcuts
  if (ip === '::1') return '127.0.x.x'

  // IPv4-mapped IPv6 (::ffff:127.0.0.1)
  const v4Match = ip.match(/(\d{1,3}\.\d{1,3})\.\d{1,3}\.\d{1,3}$/)
  if (v4Match) return `${v4Match[1]}.x.x`

  // Generic IPv6 (keep first 2 blocks, mask rest)
  const parts = ip.split(':').filter(Boolean)
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}::x:x`

  return 'anonymous'
}

/**
 * BAN CHECK
 * Verifies whether a user is restricted from submitting feedback.
 */
async function isBanned(userId: string): Promise<boolean> {
  try {
    const result = await pool.query(
      'SELECT 1 FROM feedback_bans WHERE user_id = $1',
      [userId]
    )
    return (result.rowCount ?? 0) > 0
  } catch (err) {
    logger.error('isBanned check failed', err, { userId })
    return false
  }
}

/**
 * FEEDBACK INGESTION
 * Sends structured reports to Discord + Sentry.
 */
router.post(
  '/',
  feedbackLimiter,
  upload.single('screenshot'),
  async (req: Request, res: Response) => {
    const multerReq = req as Request & { file?: Express.Multer.File }

    const {
      nickname,
      email,
      message,
      category,
      userId,
      shortId,
      points,
      streak,
      flashEvent,
      route,
      viewport,
      sentryEventId
    } = multerReq.body

    const ip = getSafeIp(multerReq)

    if (!message?.trim())
      return res.status(400).json({ error: 'Message required' })
    if (userId && (await isBanned(userId)))
      return res.status(403).json({ error: 'BANNED' })

    const cat = CATEGORIES[category] || {
      label: '❓ Uncategorized',
      color: 0x95a5a6
    }
    const banUrl = `${API_BASE}/api/feedback/ban/${userId}?key=${ADMIN_KEY}`

    Sentry.withScope((scope) => {
      scope.setUser({
        id: userId,
        username: nickname || 'Anonymous',
        email: email || undefined
      })
      scope.setContext('game_state', {
        points,
        streak,
        flashEvent: flashEvent || null,
        route
      })
      scope.setTag('feedback_category', category || 'unknown')

      const linkedEventId =
        sentryEventId ||
        Sentry.captureMessage(`[Feedback] ${message.slice(0, 50)}`, 'info')

      Sentry.captureFeedback({
        name: nickname || 'Anonymous',
        email: email || '',
        message: String(message),
        associatedEventId: linkedEventId
      })
    })

    const discordData = new FormData()

    const embed = {
      title: cat.label,
      color: cat.color,
      description: message,
      fields: [
        {
          name: '👤 Player',
          value: `**${nickname || 'Anonymous'}**\n\`${shortId || 'n/a'}\``,
          inline: true
        },
        { name: '💰 Points', value: `\`${points || 'n/a'}\``, inline: true },
        { name: '🔥 Streak', value: `\`x${streak || 0}\``, inline: true },
        {
          name: '🌐 Context',
          value: `Route: \`${route || '/'}\`\nIP: \`${maskIp(ip)}\``,
          inline: false
        },
        {
          name: '🛠️ Trace',
          value: sentryEventId ? `[Sentry](${sentryEventId})` : 'No Trace',
          inline: true
        },
        { name: '🚫 Admin', value: `[Ban User](${banUrl})`, inline: true }
      ],
      timestamp: new Date().toISOString(),
      footer: { text: `Viewport: ${viewport || 'unknown'}` }
    }

    discordData.append('payload_json', JSON.stringify({ embeds: [embed] }))

    if (multerReq.file) {
      const blob = new Blob([new Uint8Array(multerReq.file.buffer)], {
        type: multerReq.file.mimetype
      })
      discordData.append(
        'file',
        blob,
        multerReq.file.originalname || 'screenshot.png'
      )
    }

    try {
      const discordRes = await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        body: discordData
      })

      if (!discordRes.ok) {
        const errorText = await discordRes.text()
        logger.error('Discord webhook returned error', undefined, {
          status: discordRes.status,
          body: errorText,
          userId,
          category
        })
        throw new Error('Discord dispatch failed')
      }

      res.json({ ok: true })
    } catch (err) {
      logger.error('POST /feedback failed', err, { userId, category })
      res.status(500).json({ error: 'System busy' })
    }
  }
)

/**
 * ADMIN BAN ENDPOINT
 */
router.get('/ban/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params
  const { key } = req.query

  if (!key || key !== ADMIN_KEY) return res.status(401).send('Unauthorized')

  try {
    const safeUserId = String(userId).replace(/</g, '&lt;')

    await pool.query(
      'INSERT INTO feedback_bans (user_id, banned_at) VALUES ($1, NOW()) ON CONFLICT (user_id) DO NOTHING',
      [userId]
    )

    logger.info('User banned via admin endpoint', { userId })

    res.send(
      `<html><body style="font-family:monospace;text-align:center;padding:50px;"><h2>✅ User Banned</h2><p>${safeUserId}</p></body></html>`
    )
  } catch (err) {
    logger.error('GET /feedback/ban/:userId failed', err, { userId })
    res.status(500).send('DB Error')
  }
})

/**
 * STATUS CHECK
 */
router.get('/status', async (req: Request, res: Response) => {
  const { userId } = req.query
  if (!userId || typeof userId !== 'string') return res.json({ banned: false })

  const banned = await isBanned(userId)
  res.json({ banned })
})

export default router
