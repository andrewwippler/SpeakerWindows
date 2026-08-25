import type { HttpContext } from '@adonisjs/core/http'
import Illustration from '#models/illustration'

export default class DashboardController {
  public async index({ auth, view }: HttpContext) {
    try {
      const illustrations = await Illustration.query()
        .where('user_id', `${auth.user?.id}`)
        .preload('tags', (builder) => {
          builder.orderBy('name', 'asc')
        })
        .preload('user')
        .orderBy('created_at', 'desc')

      return view.render('illustrations/index', { illustrations })
    } catch (error) {
      console.error('Dashboard error:', error)
      return view.render('illustrations/index', { illustrations: [] })
    }
  }
}
