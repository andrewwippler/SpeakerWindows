import type { HttpContext } from '@adonisjs/core/http'
import Tag from '#models/tag'
import _ from 'lodash'

export default class TagController {
  public async index({ view, auth }: HttpContext) {
    const tags = await Tag.query().where('user_id', auth.user!.id).orderBy('name')
    return view.render('tags/index', { tags })
  }

  public async show({ params, auth, response, view }: HttpContext) {
    const tagName = decodeURI(_.get(params, 'name', ''))
    const userId = auth.user?.id

    try {
      const tags = await Tag.query()
        .where('name', 'ILIKE', tagName)
        .where('user_id', `${userId}`)
        .orderBy('name', 'asc')

      if (tags.length === 0) {
        return response.notFound({ message: 'Tag not found' })
      }

      const tag = tags[0]

      const illustrationMap = new Map<number, any>()
      for (const t of tags) {
        const tagIllustrations = await t.related('illustrations').query().orderBy('title')
        for (const ill of tagIllustrations) {
          if (!illustrationMap.has(ill.id)) {
            illustrationMap.set(ill.id, ill)
          }
        }
      }

      const illustrations = Array.from(illustrationMap.values()).sort((a, b) =>
        a.title.localeCompare(b.title)
      )

      return view.render('tags/show', {
        tag,
        illustrations,
      })
    } catch (error) {
      console.error('Tag show error:', error)
      return response.internalServerError({ message: 'Database error' })
    }
  }
}
