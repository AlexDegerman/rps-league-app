import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import multer, { type FileFilterCallback } from 'multer'
import * as Sentry from '@sentry/node'
import { fileTypeFromBuffer } from 'file-type'
import pool from '../utils/db.js'
import rateLimit from 'express-rate-limit'
import { logger } from '../utils/logger.js'
import { formatStat } from '../utils/formatStat.js'
import { maskIpForLogs } from '../utils/maskIp.js'

const DISCORD_WEBHOOK_URL = process.env.DISCORD_FEEDBACK_WEBHOOK!
const ADMIN_KEY = process.env.FEEDBACK_ADMIN_KEY!
const API_BASE = process.env.API_BASE_URL || 'http://localhost:5000'
const SIGHTENGINE_USER = process.env.SIGHTENGINE_USER
const SIGHTENGINE_SECRET = process.env.SIGHTENGINE_SECRET
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const SENTRY_ORG = process.env.SENTRY_ORG

if (!process.env.API_BASE_URL && process.env.NODE_ENV === 'production') {
  logger.warn('API_BASE_URL is missing. Admin links may break.')
}

const CATEGORIES: Record<string, { label: string; color: number }> = {
  bug: { label: '🐛 Technical Issue', color: 0xe74c3c },
  visuals: { label: '🎨 Visuals & Animations', color: 0x3498db },
  balance: { label: '⚖️ Gameplay & Balance', color: 0xf1c40f },
  oracle: { label: '👁️ AI Oracle Analysis', color: 0x9b59b6 },
  suggestion: { label: '💡 Suggestion', color: 0x34495e },
  praise: { label: '🙌 General Praise', color: 0x2ecc71 }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) => {
    cb(null, ALLOWED_IMAGE_TYPES.includes(file.mimetype))
  }
})

const uploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload.single('screenshot')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'FILE_TOO_LARGE' })
      }
      return res.status(400).json({ error: err.code })
    } else if (err) {
      return res.status(400).json({ error: 'INVALID_FILE' })
    }
    next()
  })
}

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

// Validate actual file bytes server-side (mimetype is spoofable)
async function isValidImage(buffer: Buffer): Promise<boolean> {
  const type = await fileTypeFromBuffer(buffer)
  return !!type && ALLOWED_IMAGE_TYPES.includes(type.mime)
}

// Check contents with Sightengine (fails closed on error or timeout)
async function isImageSafe(buffer: Buffer): Promise<boolean> {
  if (!SIGHTENGINE_USER || !SIGHTENGINE_SECRET) {
    logger.warn('Sightengine credentials missing, rejecting image')
    return false
  }

  const form = new FormData()
  form.append('media', new Blob([new Uint8Array(buffer)]), 'screenshot.png')
  form.append('models', 'nudity-2.1,weapon,violence')
  form.append('api_user', SIGHTENGINE_USER)
  form.append('api_secret', SIGHTENGINE_SECRET)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)

  try {
    const res = await fetch('https://api.sightengine.com/1.0/check.json', {
      method: 'POST',
      body: form,
      signal: controller.signal
    })

    clearTimeout(timeout)

    if (!res.ok) {
      logger.error('Sightengine request failed', {
        status: res.status
      })
      return false
    }

    const data = await res.json()

    if (data.status !== 'success') {
      logger.error('Sightengine moderation failed', data)
      return false
    }

    const nudity = data.nudity?.raw ?? 0
    const violence = data.violence?.prob ?? 0

    const firearm = data.weapon?.classes?.firearm ?? 0
    const knife = data.weapon?.classes?.knife ?? 0
    const weaponScore = Math.max(firearm, knife)

    const safe = nudity < 0.5 && weaponScore < 0.5 && violence < 0.5

    if (!safe) {
      logger.info('Image rejected by moderation', {
        nudity,
        weapon: weaponScore,
        violence
      })
    }

    return safe
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      logger.error('Sightengine request timed out')
    } else {
      logger.error('Image moderation check failed', err)
    }

    return false
  } finally {
    clearTimeout(timeout)
  }
}

router.post(
  '/',
  feedbackLimiter,
  uploadMiddleware,
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

    if (multerReq.file) {
      const validType = await isValidImage(multerReq.file.buffer)
      if (!validType) {
        logger.info('Feedback screenshot rejected: invalid file type', {
          userId
        })
        return res.status(400).json({ error: 'INVALID_FILE' })
      }

      const safe = await isImageSafe(multerReq.file.buffer)
      if (!safe) {
        logger.info('Feedback screenshot rejected by moderation', { userId })
        return res.status(400).json({ error: 'IMAGE_REJECTED' })
      }
    }

    const cat = CATEGORIES[category] || {
      label: '❓ Uncategorized',
      color: 0x95a5a6
    }
    const banUrl = `${API_BASE}/api/feedback/ban/${userId}?key=${ADMIN_KEY}`

    let linkedEventId = sentryEventId

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

      if (!linkedEventId) {
        const level: Sentry.SeverityLevel =
          category === 'bug' ? 'error' : 'info'
        linkedEventId = Sentry.captureMessage(
          `[Feedback] ${message.slice(0, 50)}`,
          level
        )
      }

      Sentry.captureFeedback({
        name: nickname || 'Anonymous',
        email: email || '',
        message: String(message),
        associatedEventId: linkedEventId
      })
    })

    const discordData = new FormData()

    let traceValue = 'No Trace'
    if (linkedEventId) {
      const dsn = process.env.SENTRY_DSN
      if (dsn) {
        try {
          const u = new URL(dsn)
          const parts = u.hostname.split('.')
          const resolvedOrg =
            SENTRY_ORG ||
            (u.hostname.endsWith('sentry.io') && parts.length >= 3
              ? parts[0]
              : null)

          if (resolvedOrg) {
            traceValue = `[${linkedEventId.slice(0, 8)}](https://${resolvedOrg}.sentry.io/issues/?query=${linkedEventId})`
          } else {
            traceValue = `\`${linkedEventId.slice(0, 8)}\``
          }
        } catch {
          traceValue = `\`${linkedEventId.slice(0, 8)}\``
        }
      } else {
        traceValue = `\`${linkedEventId.slice(0, 8)}\``
      }
    }

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
        {
          name: '💰 Points',
          value:
            points !== undefined && points !== null
              ? `\`${formatStat(points).formatted}\``
              : '`n/a`',
          inline: true
        },
        { name: '🔥 Streak', value: `\`x${streak || 0}\``, inline: true },
        {
          name: '🌐 Context',
          value: `Route: \`${route || '/'}\`\nIP: \`${maskIpForLogs(ip)}\``,
          inline: false
        },
        {
          name: '🛠️ Trace',
          value: traceValue,
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

router.get('/status', async (req: Request, res: Response) => {
  const { userId } = req.query
  if (!userId || typeof userId !== 'string') return res.json({ banned: false })

  const banned = await isBanned(userId)
  res.json({ banned })
})

export default router
