import type { HttpContext } from '@adonisjs/core/http'
import Illustration from '#models/illustration'
import _ from 'lodash'

export default class AuthorController {
  public async index({ view, auth }: HttpContext) {
    const authors = await Illustration.query()
      .where('user_id', auth.user!.id)
      .select('author')
      .distinct()
      .orderBy('author')
    return view.render('authors/index', { authors })
  }

  public async show({ params, auth, response, view }: HttpContext) {
    const authorName = decodeURI(_.get(params, 'name', ''))
    const userId = auth.user?.id

    try {
      const illustrations = await Illustration.query()
        .where('author', authorName)
        .andWhere('user_id', `${userId}`)
        .preload('tags', (builder) => {
          builder.orderBy('name', 'asc')
        })
        .orderBy('title', 'asc')

      if (illustrations.length === 0) {
        return response.notFound({ message: 'Author not found' })
      }

      return view.render('authors/show', {
        author: authorName,
        illustrations,
      })
    } catch (error) {
      console.error('Author show error:', error)
      return response.internalServerError({ message: 'Database error' })
    }
  }
}
