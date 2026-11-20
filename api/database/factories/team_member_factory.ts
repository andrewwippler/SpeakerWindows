import TeamMember from '#models/team_member'
import Factory from '@adonisjs/lucid/factories'

export default Factory.define(TeamMember, () => {
  return {
    role: 'owner' as const,
  }
}).build()
