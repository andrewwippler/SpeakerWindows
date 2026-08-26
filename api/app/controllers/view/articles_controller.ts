import type { HttpContext } from '@adonisjs/core/http'
import Illustration from '#models/illustration'

export default class ArticlesController {
  public async index({ view, auth, session }: HttpContext) {
    const recentIds: number[] = session.get('recentlyViewed') || []
    let recentlyViewed: any[] = []
    if (recentIds.length) {
      recentlyViewed = await Illustration.query()
        .whereIn('id', recentIds)
        .preload('tags')
        .preload('uploads')
    }
    return view.render('articles/index', { recentlyViewed })
  }
}
