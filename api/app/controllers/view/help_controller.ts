import type { HttpContext } from '@adonisjs/core/http'

export default class HelpController {
  public async index({ view }: HttpContext) {
    return view.render('help/index')
  }
  public async search({ view }: HttpContext) {
    return view.render('help/search')
  }
  public async create({ view }: HttpContext) {
    return view.render('help/create')
  }
  public async importHelp({ view }: HttpContext) {
    return view.render('help/import')
  }
}
