import type { HttpContext } from '@adonisjs/core/http'

export default class SearchController {
  public async index({ view }: HttpContext) {
    return view.render('search/index')
  }
}
