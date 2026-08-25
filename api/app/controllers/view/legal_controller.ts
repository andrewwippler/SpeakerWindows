import type { HttpContext } from '@adonisjs/core/http'

export default class LegalController {
  public async tos({ view }: HttpContext) {
    return view.render('legal/tos')
  }
  public async privacy({ view }: HttpContext) {
    return view.render('legal/privacy')
  }
}
