import type { HttpContext } from '@adonisjs/core/http'
import Illustration from '#models/illustration'
import Tag from '#models/tag'
import TagSlugSanitizer from '#app/helpers/tag'
import crypto from 'node:crypto'
import {
  canViewIllustration,
  canEditIllustration,
  canDeleteIllustration,
} from '#app/abilities/main'
import _ from 'lodash'

export default class IllustrationController {
  public async new({ view, auth }: HttpContext) {
    const tags = await Tag.query().where('user_id', auth.user!.id).orderBy('name')
    return view.render('illustrations/new', { tags })
  }

  public async store({ request, auth, response, session }: HttpContext) {
    try {
      const { author, title, source, content, tags } = request.all()
      const userId = auth.user!.id

      const createData: any = {
        author: author || 'Unknown',
        title: title || 'Untitled',
        source: source || '',
        content: content || 'No description',
        user_id: userId,
      }

      const normalizedContent = (createData.content || '')
        .toString()
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase()
      const contentHash = crypto.createHash('sha256').update(normalizedContent).digest('hex')

      const existing = await Illustration.query()
        .where('user_id', userId)
        .where('source', createData.source)
        .andWhere('content_hash', contentHash)
        .first()

      if (existing) {
        session.flash('error', 'Duplicate illustration')
        return response.redirect('back')
      }

      createData.content_hash = contentHash
      const illustration = await Illustration.create(createData)

      if (tags && tags.length > 0) {
        const tagNames = Array.isArray(tags) ? tags : [tags]
        const newTags = [...new Set(tagNames)].map((tag: string) => ({
          slug: TagSlugSanitizer(tag + '-' + userId),
          name: tag,
          user_id: userId,
        }))
        const allTags = await Tag.fetchOrCreateMany('slug', newTags)
        await illustration.related('tags').saveMany(await allTags)
      }

      session.flash('success', 'Illustration created!')
      return response.redirect(`/illustrations/${illustration.id}`)
    } catch (error) {
      console.error('Illustration store error:', error)
      session.flash('error', 'Failed to create illustration')
      return response.redirect('/illustrations/new')
    }
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
        .preload('uploads', (builder) => {
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

  public async show({ params, auth, response, view, session }: HttpContext) {
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

      const recentIds: number[] = session.get('recentlyViewed') || []
      const filtered = recentIds.filter((rid: number) => rid !== id)
      filtered.unshift(id)
      session.put('recentlyViewed', filtered.slice(0, 50))

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

      const tags = await Tag.query().where('user_id', auth.user!.id).orderBy('name')

      return view.render('illustrations/edit', { illustration, tags })
    } catch (error) {
      console.error('Illustration edit error:', error)
      return response.internalServerError({ message: 'Database error' })
    }
  }

  public async update({ params, auth, request, response, session }: HttpContext) {
    const rawId = _.get(params, 'id', 0)
    const id = Number.parseInt(rawId, 10) || 0

    try {
      const illustration = await Illustration.findByOrFail('id', id)

      const canEdit = await canEditIllustration(auth.user!, illustration)
      if (!canEdit) {
        session.flash('error', 'Not authorized')
        return response.redirect('back')
      }

      const { author, title, source, content, tags } = request.all()

      if (author !== undefined) illustration.author = author
      if (title !== undefined) illustration.title = title
      if (source !== undefined) illustration.source = source
      if (content !== undefined) illustration.content = content

      await illustration.save()

      if (tags !== undefined) {
        const tagNames = Array.isArray(tags) ? tags : [tags]
        const filtered = tagNames.filter((t: string) => t && t.trim())
        if (filtered.length > 0) {
          const newTags = [...new Set(filtered)].map((tag: string) => ({
            slug: TagSlugSanitizer(
              tag +
              '-' +
              auth.user!.id +
              (illustration.team_id ? '-team-' + illustration.team_id : '')
            ),
            name: tag,
            user_id: auth.user!.id,
            team_id: illustration.team_id ?? null,
          }))
          const allTags = await Tag.fetchOrCreateMany('slug', newTags)
          await illustration.related('tags').detach()
          await illustration.related('tags').saveMany(await allTags)
        }
      }

      session.flash('success', 'Illustration updated!')
      return response.redirect(`/illustrations/${id}`)
    } catch (error) {
      console.error('Illustration update error:', error)
      session.flash('error', 'Failed to update illustration')
      return response.redirect('back')
    }
  }

  public async destroy({ params, auth, response, session }: HttpContext) {
    const rawId = _.get(params, 'id', 0)
    const id = Number.parseInt(rawId, 10) || 0

    try {
      const illustration = await Illustration.findByOrFail('id', id)

      const canDelete = await canDeleteIllustration(auth.user!, illustration)
      if (!canDelete) {
        session.flash('error', 'Not authorized to delete')
        return response.redirect('back')
      }

      await illustration.related('tags').detach()
      await illustration.delete()

      session.flash('success', 'Illustration deleted')
      return response.redirect('/illustrations')
    } catch (error) {
      console.error('Illustration destroy error:', error)
      session.flash('error', 'Failed to delete illustration')
      return response.redirect('back')
    }
  }
}
