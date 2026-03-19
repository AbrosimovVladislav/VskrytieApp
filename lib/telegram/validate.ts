import { validate, parse } from '@telegram-apps/init-data-node'

export interface TelegramInitData {
  user?: {
    id: number
    firstName: string
    lastName?: string
    username?: string
    languageCode?: string
  }
  chatInstance?: string
  chatType?: string
  authDate: number
  hash: string
}

export function validateTelegramInitData(initDataRaw: string): TelegramInitData {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN is not configured')
  }

  validate(initDataRaw, botToken)
  return parse(initDataRaw) as unknown as TelegramInitData
}

export function getTelegramUserId(initDataRaw: string): bigint {
  const data = validateTelegramInitData(initDataRaw)
  if (!data.user?.id) {
    throw new Error('No user in initData')
  }
  return BigInt(data.user.id)
}
