import type { HttpContext } from '@adonisjs/core/http'
import Illustration from '#models/illustration'
import Tag from '#models/tag'
import Place from '#models/place'
import Upload from '#models/upload'
import Setting from '#models/setting'
import TagSlugSanitizer from '#app/helpers/tag'
import { randomUUID, createHash } from 'node:crypto'
import {
  canViewIllustration,
  canEditIllustration,
  canDeleteIllustration,
} from '#app/abilities/main'
import _ from 'lodash'
import app from '@adonisjs/core/services/app'
import env from '#start/env'
import fs from 'node:fs/promises'
import { DateTime } from 'luxon'

export default class IllustrationController {
  public async new({ view, auth }: HttpContext) {
    const tags = await Tag.query().where('user_id', auth.user!.id).orderBy('name')
    return view.render('illustrations/new', { tags })
  }

  public async store({ request, auth, response, session }: HttpContext) {
    try {
      const { author, title, source, content, tags, private: isPrivate } = request.all()
      const userId = auth.user!.id

      const createData: any = {
        author: author || 'Unknown',
        title: title || 'Untitled',
        source: source || '',
        content: content || 'No description',
        user_id: userId,
        private: isPrivate === true || isPrivate === 'on' || isPrivate === 'true',
      }

      const normalizedContent = (createData.content || '')
        .toString()
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase()
      const contentHash = createHash('sha256').update(normalizedContent).digest('hex')

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

      const tagNames = this.parseTags(tags)
      if (tagNames.length > 0) {
        const newTags = tagNames.map((tag: string) => ({
          slug: TagSlugSanitizer(tag + '-' + userId),
          name: tag,
          user_id: userId,
        }))
        const allTags = await Tag.fetchOrCreateMany('slug', newTags)
        await illustration.related('tags').saveMany(await allTags)
      }

      const uploadError = await this.attachUpload(illustration, request, userId)
      if (uploadError) {
        session.flash('error', uploadError)
      } else {
        session.flash('success', 'Illustration created!')
      }
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

      const canEdit = await canEditIllustration(auth.user!, illustration)
      const settings = await Setting.query().where('user_id', auth.user!.id).first()

      const recentIds: number[] = session.get('recentlyViewed') || []
      const filtered = recentIds.filter((rid: number) => rid !== id)
      filtered.unshift(id)
      session.put('recentlyViewed', filtered.slice(0, 50))

      return view.render('illustrations/show', {
        illustration,
        canEdit,
        settings,
        today: DateTime.now().toFormat('yyyy-MM-dd'),
      })
    } catch (error) {
      console.error('Illustration show error:', error)
      return response.internalServerError({ message: 'Database error' })
    }
  }

  public async edit({ params, auth, response, view, session }: HttpContext) {
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

      const canEdit = await canEditIllustration(auth.user!, illustration)
      if (!canEdit) {
        session.flash('error', 'You do not have permission to edit this illustration')
        return response.redirect(`/illustrations/${id}`)
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

      const { author, title, source, content, tags, private: isPrivate } = request.all()

      if (author !== undefined) illustration.author = author
      if (title !== undefined) illustration.title = title
      if (source !== undefined) illustration.source = source
      if (content !== undefined) illustration.content = content
      illustration.private = isPrivate === true || isPrivate === 'on' || isPrivate === 'true'

      await illustration.save()

      if (tags !== undefined) {
        const tagNames = this.parseTags(tags)
        if (tagNames.length > 0) {
          const newTags = tagNames.map((tag: string) => ({
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
        } else {
          await illustration.related('tags').detach()
        }
      }

      const uploadError = await this.attachUpload(illustration, request, auth.user!.id)
      if (uploadError) {
        session.flash('error', uploadError)
      } else {
        session.flash('success', 'Illustration updated!')
      }
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

  public async storePlace({ params, auth, request, response, session }: HttpContext) {
    const illustrationId = Number.parseInt(_.get(params, 'id', 0), 10) || 0

    try {
      const illustration = await Illustration.findByOrFail('id', illustrationId)

      const canEdit = await canEditIllustration(auth.user!, illustration)
      if (!canEdit) {
        session.flash('error', 'Not authorized to add places')
        return response.redirect(`/illustrations/${illustrationId}`)
      }

      const { place, location, used } = request.all()

      await illustration.related('places').create({
        user_id: auth.user!.id,
        place: String(place || '').trim() || 'Someplace',
        location: String(location || '').trim() || 'Somewhere',
        used: used ? used : null,
      })

      session.flash('success', `Added ${place || 'Someplace'}, ${location || 'Somewhere'} to "${illustration.title}"`)
      return response.redirect(`/illustrations/${illustrationId}`)
    } catch (error) {
      console.error('Place store error:', error)
      session.flash('error', 'Failed to add place')
      return response.redirect(`/illustrations/${illustrationId}`)
    }
  }

  public async destroyPlace({ params, auth, response, session }: HttpContext) {
    const placeId = Number.parseInt(_.get(params, 'placeId', 0), 10) || 0
    const illustrationId = Number.parseInt(_.get(params, 'id', 0), 10) || 0

    try {
      const place = await Place.findByOrFail('id', placeId)

      if (_.toInteger(place.user_id) !== _.toInteger(auth.user!.id)) {
        session.flash('error', 'Not authorized to delete place')
        return response.redirect(`/illustrations/${illustrationId}`)
      }

      await place.delete()
      session.flash('success', 'Place deleted')
      return response.redirect(`/illustrations/${illustrationId}`)
    } catch (error) {
      console.error('Place destroy error:', error)
      session.flash('error', 'Failed to delete place')
      return response.redirect(`/illustrations/${illustrationId}`)
    }
  }

  public async upload({ params, auth, request, response, session }: HttpContext) {
    const illustrationId = Number.parseInt(_.get(params, 'id', 0), 10) || 0

    try {
      const illustration = await Illustration.findByOrFail('id', illustrationId)

      const canEdit = await canEditIllustration(auth.user!, illustration)
      if (!canEdit) {
        session.flash('error', 'Not authorized to upload')
        return response.redirect(`/illustrations/${illustrationId}`)
      }

      const sentFile = request.file('illustration_image', {
        size: '20mb',
        extnames: ['jpg', 'png', 'gif', 'pdf'],
      })

      if (!sentFile) {
        session.flash('error', 'No file uploaded')
        return response.redirect(`/illustrations/${illustrationId}/edit`)
      }

      if (!sentFile.isValid) {
        session.flash('error', 'Invalid file')
        return response.redirect(`/illustrations/${illustrationId}/edit`)
      }

      const pathEnv = env.get('NODE_ENV')
      await sentFile.move(app.makePath('uploads', pathEnv), {
        name: `${auth.user!.id}/${illustrationId}/${randomUUID()}.${sentFile.extname}`,
      })

      await illustration.related('uploads').create({
        name: sentFile.fileName!,
        type: sentFile.type,
      })

      session.flash('success', 'File uploaded successfully')
      return response.redirect(`/illustrations/${illustrationId}/edit`)
    } catch (error) {
      console.error('Upload error:', error)
      session.flash('error', 'Failed to upload file')
      return response.redirect(`/illustrations/${illustrationId}/edit`)
    }
  }

  public async destroyUpload({ params, auth, response, session }: HttpContext) {
    const uploadId = Number.parseInt(_.get(params, 'uploadId', 0), 10) || 0
    const illustrationId = Number.parseInt(_.get(params, 'id', 0), 10) || 0

    try {
      const upload = await Upload.query().where('id', uploadId).preload('illustration')
      if (!upload[0]) {
        session.flash('error', 'Upload not found')
        return response.redirect(`/illustrations/${illustrationId}/edit`)
      }

      if (_.toInteger(upload[0].illustration.user_id) !== _.toInteger(auth.user!.id)) {
        session.flash('error', 'Not authorized to delete upload')
        return response.redirect(`/illustrations/${illustrationId}/edit`)
      }

      await upload[0].delete()

      const uploadsPath = app.makePath('uploads', env.get('NODE_ENV'), upload[0].name)
      await fs.rm(uploadsPath, { recursive: false, force: true })

      session.flash('success', 'Attachment deleted')
      return response.redirect(`/illustrations/${illustrationId}/edit`)
    } catch (error) {
      console.error('Upload destroy error:', error)
      session.flash('error', 'Failed to delete upload')
      return response.redirect(`/illustrations/${illustrationId}/edit`)
    }
  }

  private parseTags(tags: unknown): string[] {
    if (tags === undefined || tags === null || tags === '') return []
    const list = Array.isArray(tags) ? tags : String(tags).split(',')
    return [
      ...new Set(list.map((t: string) => String(t).trim()).filter((t: string) => t.length > 0)),
    ]
  }

  private async attachUpload(
    illustration: Illustration,
    request: HttpContext['request'],
    userId: number
  ): Promise<string | null> {
    const sentFile = request.file('illustration_image', {
      size: '20mb',
      extnames: ['jpg', 'png', 'gif', 'pdf'],
    })

    if (!sentFile) {
      return null
    }

    if (!sentFile.isValid) {
      return sentFile.errors[0]?.message || 'Invalid file'
    }

    const pathEnv = env.get('NODE_ENV')
    await sentFile.move(app.makePath('uploads', pathEnv), {
      name: `${userId}/${illustration.id}/${randomUUID()}.${sentFile.extname}`,
    })

    await illustration.related('uploads').create({
      name: sentFile.fileName!,
      type: sentFile.type,
    })

    return null
  }
}
