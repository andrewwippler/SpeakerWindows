import type { HttpContext } from '@adonisjs/core/http'
import Illustration from '#models/illustration'

export default class ArticlesController {
  public async index({ view, auth }: HttpContext) {
    const recentIds: number[] = (auth.user as any)?.recentlyViewed || []
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
