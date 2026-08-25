import type { HttpContext } from '@adonisjs/core/http'
import TeamInvitation from '#models/team_invitation'

export default class InvitationController {
  public async index({ auth, view }: HttpContext) {
    try {
      const invitations = await TeamInvitation.query()
        .where('userId', `${auth.user?.id}`)
        .preload('team')
        .preload('user')
        .orderBy('created_at', 'desc')

      return view.render('invitations/index', { invitations })
    } catch (error) {
      console.error('Invitations index error:', error)
      return view.render('invitations/index', { invitations: [] })
    }
  }
}
