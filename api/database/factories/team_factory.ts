import Team from '#models/team'
import Factory from '@adonisjs/lucid/factories'
import { generateInviteCode } from '#services/invite_code_service'

export default Factory.define(Team, () => {
  return {
    name: 'My Team',
    inviteCode: generateInviteCode(),
  }
}).build()
