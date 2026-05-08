import TeamMember from '#models/team_member'
import Factory from '@adonisjs/lucid/factories'

export default Factory.define(TeamMember, ({ faker }) => {
  return {
    role: 'owner',
  }
}).build()
