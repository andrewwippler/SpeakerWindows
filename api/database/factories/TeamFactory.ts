import Team from '#models/team'
import Factory from '@adonisjs/lucid/factories'

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export default Factory.define(Team, ({ faker }) => {
  return {
    name: 'My Team',
    inviteCode: generateInviteCode(),
  }
}).build()
