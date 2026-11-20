import { randomInt } from 'node:crypto'

const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const LOWER = 'abcdefghijkmnopqrstuvwxyz'
const DIGITS = '23456789'
const SPECIALS = '!@#$%^&*'
const ALL = `${UPPER}${LOWER}${DIGITS}${SPECIALS}`

function randomChar(chars: string): string {
  return chars[randomInt(chars.length)]
}

export function generateTemporaryPassword(length = 16): string {
  const chars = [randomChar(UPPER), randomChar(LOWER), randomChar(DIGITS), randomChar(SPECIALS)]

  while (chars.length < length) {
    chars.push(randomChar(ALL))
  }

  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    const swap = chars[i]
    chars[i] = chars[j]
    chars[j] = swap
  }

  return chars.join('')
}
