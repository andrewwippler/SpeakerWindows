import type { HttpContext } from '@adonisjs/core/http'
import Tag from '#models/tag'
import Illustration from '#models/illustration'
import _ from 'lodash'
import { buildColumns, displayName } from '#app/helpers/tag'

export default class TagController {
  public async index({ view, auth }: HttpContext) {
    const tags = await Tag.query().where('user_id', auth.user!.id).orderBy('name')
    return view.render('tags/index', {
      tags,
      columns: buildColumns(tags),
      display: displayName,
    })
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
        selectable: true,
        allIds: illustrations.map((i) => String(i.id)),
      })
    } catch (error) {
      console.error('Tag show error:', error)
      return response.internalServerError({ message: 'Database error' })
    }
  }

  public async update({ params, auth, request, response, session }: HttpContext) {
    const id = Number.parseInt(_.get(params, 'id', 0), 10) || 0
    const { name } = request.all()

    if (name === undefined || String(name).trim() === '') {
      session.flash('error', 'Tag name cannot be empty')
      return response.redirect('back')
    }

    const tag = await Tag.find(id)
    if (!tag || _.toInteger(tag.user_id) !== _.toInteger(auth.user!.id)) {
      session.flash('error', 'Tag not found')
      return response.redirect('/tags')
    }

    tag.name = String(name)
    tag.slug = ''
    await tag.save()

    session.flash('success', `Tag renamed to ${tag.name}`)
    return response.redirect(`/tags/${tag.name}`)
  }

  public async destroy({ params, auth, response, session }: HttpContext) {
    const id = Number.parseInt(_.get(params, 'id', 0), 10) || 0

    const tag = await Tag.find(id)
    if (!tag || _.toInteger(tag.user_id) !== _.toInteger(auth.user!.id)) {
      session.flash('error', 'Tag not found')
      return response.redirect('/tags')
    }

    await tag.delete()
    session.flash('success', 'Tag deleted')
    return response.redirect('/tags')
  }

  public async bulk({ params, auth, request, response, session }: HttpContext) {
    const tagName = decodeURI(_.get(params, 'name', ''))
    const { action, ids, private: privateValue } = request.all()

    const tag = await Tag.query()
      .where('name', 'ILIKE', tagName)
      .where('user_id', `${auth.user!.id}`)
      .first()

    if (!tag) {
      session.flash('error', 'Tag not found')
      return response.redirect('/tags')
    }

    const illustrationIds = (Array.isArray(ids) ? ids : ids ? [ids] : [])
      .map((i: string) => Number.parseInt(String(i), 10))
      .filter((n: number) => Number.isFinite(n))

    if (illustrationIds.length === 0) {
      session.flash('error', 'No illustrations selected')
      return response.redirect(`/tags/${tag.name}`)
    }

    if (action === 'remove_tag') {
      const count = await tag
        .related('illustrations')
        .query()
        .whereIn('illustrations.id', illustrationIds)
      await tag.related('illustrations').detach(count.map((i) => i.id))
      session.flash('success', `Removed ${count.length} illustration(s) from tag "${tag.name}"`)
      return response.redirect(`/tags/${tag.name}`)
    }

    if (action === 'toggle_privacy') {
      const privateBool = privateValue === true || privateValue === 'true' || privateValue === '1'
      await Illustration.query()
        .whereIn('id', illustrationIds)
        .where('user_id', auth.user!.id)
        .update({ private: privateBool })
      session.flash('success', `Updated privacy for ${illustrationIds.length} illustration(s)`)
      return response.redirect(`/tags/${tag.name}`)
    }

    session.flash('error', 'Unknown bulk action')
    return response.redirect(`/tags/${tag.name}`)
  }
}
