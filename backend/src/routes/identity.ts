import { Router, type Request, type Response } from 'express'

const router = Router()
const INTERNAL_NETWORK_URL =
  process.env.INTERNAL_NETWORK_URL || 'http://arkalon-network:3000'
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || ''

router.post('/provision', async (req: Request, res: Response) => {
  try {
    const coreId =
      req.cookies?.arkalon_core_id || req.body?.coreId || req.body?.legacyUserId

    const response = await fetch(
      `${INTERNAL_NETWORK_URL}/api/identity/provision`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': INTERNAL_SERVICE_SECRET
        },
        body: JSON.stringify({ coreId: coreId || undefined })
      }
    )

    if (!response.ok) throw new Error('Failed to provision')
    const data = await response.json()

    // Set root cookies for the Arkalon ecosystem
    res.cookie('arkalon_core_id', data.coreId, {
      domain: '.rpsleague.fi',
      maxAge: 31_536_000 * 1000, // 1 year
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/'
    })
    if (data.sessionToken) {
      res.cookie('arkalon_session', data.sessionToken, {
        domain: '.rpsleague.fi',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/'
      })
    }

    res.json({
      success: true,
      coreId: data.coreId,
      shortId: data.shortId,
      displayName: data.nickname
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Provisioning failed' })
  }
})

router.post('/reroll', async (req: Request, res: Response) => {
  const coreId = req.cookies?.arkalon_core_id
  if (!coreId)
    return res.status(401).json({ success: false, error: 'No session' })

  try {
    const response = await fetch(
      `${INTERNAL_NETWORK_URL}/api/identity/reroll`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': INTERNAL_SERVICE_SECRET
        },
        body: JSON.stringify({ coreId })
      }
    )

    if (!response.ok) throw new Error('Failed to reroll')
    const data = await response.json()

    res.json({ success: true, nickname: data.nickname })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Reroll failed' })
  }
})

export default router
