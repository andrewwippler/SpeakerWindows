import { randomInt } from 'node:crypto'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export function generateInviteCode(length = 8): string {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += CHARS[randomInt(CHARS.length)]
  }
  return code
}
