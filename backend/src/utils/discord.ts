import { logger } from './logger.js'

export interface DiscordEmbedField {
  name: string
  value: string
  inline?: boolean
}

export interface DiscordEmbed {
  title?: string
  description?: string
  color?: number
  fields?: DiscordEmbedField[]
  timestamp?: string
  footer?: { text: string }
}

export interface DiscordFile {
  buffer: Buffer
  mimetype: string
  filename: string
}

/**
 * Posts an embed and optional file attachment to a Discord webhook.
 * Logs HTTP error detail at warn level, then throws, callers decide severity.
 */
export async function sendDiscordWebhook(
  webhookUrl: string,
  embed: DiscordEmbed,
  file?: DiscordFile
): Promise<void> {
  const form = new FormData()
  form.append('payload_json', JSON.stringify({ embeds: [embed] }))

  if (file) {
    const blob = new Blob([new Uint8Array(file.buffer)], {
      type: file.mimetype
    })
    form.append('file', blob, file.filename)
  }

  const res = await fetch(webhookUrl, { method: 'POST', body: form })

  if (!res.ok) {
    const body = await res.text()
    logger.warn('Discord webhook HTTP error', { status: res.status, body })
    throw new Error(`Discord webhook failed: ${res.status}`)
  }
}
