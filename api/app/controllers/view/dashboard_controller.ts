import type { HttpContext } from '@adonisjs/core/http'
import Tag from '#models/tag'
import { buildColumns, displayName } from '#app/helpers/tag'

export default class DashboardController {
  public async index({ auth, view }: HttpContext) {
    const tags = await Tag.query().where('user_id', auth.user!.id).orderBy('name')
    return view.render('tags/index', {
      tags,
      columns: buildColumns(tags),
      display: displayName,
    })
  }
}
