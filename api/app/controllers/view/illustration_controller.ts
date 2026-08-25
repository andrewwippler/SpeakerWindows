import type { HttpContext } from '@adonisjs/core/http'
import Illustration from '#models/illustration'
import { canViewIllustration } from '#app/abilities/main'
import _ from 'lodash'

export default class IllustrationController {
  public async new({ view, auth }: HttpContext) {
    const Tag = (await import('#models/tag')).default
    const tags = await Tag.query().where('user_id', auth.user!.id).orderBy('name')
    return view.render('illustrations/new', { tags })
  }

  public async index({ auth, request, view }: HttpContext) {
    try {
      const search = request.input('q', '')
      const tagFilter = request.input('tag', '')

      let query = Illustration.query()
        .where('user_id', `${auth.user?.id}`)
        .preload('tags', (builder) => {
          builder.orderBy('name', 'asc')
        })
        .preload('user')
        .orderBy('created_at', 'desc')

      if (search) {
        query = query.where((q) => {
          q.whereILike('title', `%${search}%`)
            .orWhereILike('author', `%${search}%`)
            .orWhereILike('content', `%${search}%`)
        })
      }

      if (tagFilter) {
        query = query.whereHas('tags', (tagQuery) => {
          tagQuery.where('name', 'ILIKE', tagFilter)
        })
      }

      const illustrations = await query

      return view.render('illustrations/index', {
        illustrations,
        search,
        tagFilter,
      })
    } catch (error) {
      console.error('Illustrations index error:', error)
      return view.render('illustrations/index', { illustrations: [], search: '', tagFilter: '' })
    }
  }

  public async show({ params, auth, response, view }: HttpContext) {
    const rawId = _.get(params, 'id', 0)
    const id = Number.parseInt(rawId, 10) || 0
    if (id > 2147483647 || id < -2147483648) {
      return response.badRequest({ message: 'Invalid id' })
    }

    try {
      const illustrationQuery = await Illustration.query()
        .where('id', id)
        .preload('tags', (builder) => {
          builder.orderBy('name', 'asc')
        })
        .preload('places', (builder) => {
          builder.orderBy('used', 'asc')
        })
        .preload('uploads', (builder) => {
          builder.orderBy('name', 'asc')
        })

      if (!illustrationQuery[0]) {
        return response.notFound({ message: 'Illustration not found' })
      }

      const illustration = illustrationQuery[0]

      const canView = await canViewIllustration(auth.user!, illustration)
      if (!canView) {
        return response.forbidden({ message: 'You do not have permission to access this resource' })
      }

      return view.render('illustrations/show', { illustration })
    } catch (error) {
      console.error('Illustration show error:', error)
      return response.internalServerError({ message: 'Database error' })
    }
  }

  public async edit({ params, auth, response, view }: HttpContext) {
    const rawId = _.get(params, 'id', 0)
    const id = Number.parseInt(rawId, 10) || 0
    if (id > 2147483647 || id < -2147483648) {
      return response.badRequest({ message: 'Invalid id' })
    }

    try {
      const illustrationQuery = await Illustration.query()
        .where('id', id)
        .preload('tags', (builder) => {
          builder.orderBy('name', 'asc')
        })
        .preload('places', (builder) => {
          builder.orderBy('used', 'asc')
        })

      if (!illustrationQuery[0]) {
        return response.notFound({ message: 'Illustration not found' })
      }

      const illustration = illustrationQuery[0]

      const canView = await canViewIllustration(auth.user!, illustration)
      if (!canView) {
        return response.forbidden({ message: 'You do not have permission to access this resource' })
      }

      const Tag = (await import('#models/tag')).default
      const tags = await Tag.query().where('user_id', auth.user!.id).orderBy('name')

      return view.render('illustrations/edit', { illustration, tags })
    } catch (error) {
      console.error('Illustration edit error:', error)
      return response.internalServerError({ message: 'Database error' })
    }
  }
}
