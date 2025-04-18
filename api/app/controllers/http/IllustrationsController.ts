import type { HttpContext } from '@adonisjs/core/http'
import TagSlugSanitizer from '#app/helpers/tag'
import Illustration from '#models/illustration'
import Place from '#models/place'
import Tag from '#models/tag'
import _ from 'lodash'
import { DateTime } from 'luxon'
import { editIllustration } from '#app/abilities/main'
import Upload from '#models/upload'
import app from '@adonisjs/core/services/app'
import fs from 'fs/promises'
import env from '#start/env'

export default class IllustrationsController {

  /**
   * Displays places associated to an illustration.
   * GET illustration/:illustration_id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  public async show({ params, auth, response }: HttpContext) {

    const illustrationQuery = await Illustration.query()
      .where('id', _.get(params, 'id', 0))
      .andWhere('user_id', `${auth.user!.id}`)
      .preload('tags', (builder) => {
        builder.orderBy('name', 'asc')
      })
      .preload('places', (builder) => {
        builder.orderBy('used', 'asc')
      })
      .preload('uploads', (builder) => {
        builder.orderBy('name', 'asc')
      })

      // console.log(auth.user!.id,!!illustrationQuery[0],!illustrationQuery[0])
      if (!!illustrationQuery[0]) {
        const illustration = illustrationQuery[0].toJSON();
        return illustration
      }
      return response.status(403).send({ message: 'You do not have permission to access this resource' })


  }

    /**
   * Displays illustration associated with the old system.
   * (Backwards compatibility)
   * GET illustrations/:illustration_id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
    public async showOld({ params, auth, response }: HttpContext) {

      const illustrationQuery = await Illustration.query()
        .where('legacy_id', _.get(params, 'id', 0))
        .andWhere('user_id', `${auth.user?.id}`)
        .preload('tags', (builder) => {
          builder.orderBy('name', 'asc')
        })
        .preload('places', (builder) => {
          builder.orderBy('used', 'asc')
        })
        .preload('uploads', (builder) => {
          builder.orderBy('name', 'asc')
        })

        // console.log(_.get(params, 'id', 0),auth.user?.id,!!illustrationQuery[0],!illustrationQuery[0])
        if (!!illustrationQuery[0]) {
          const illustration = illustrationQuery[0].toJSON();
          return illustration
        }
        return response.status(403).send({ message: 'You do not have permission to access this resource' })


    }

    /**
   * Create/save a new illustration.
   * POST /illustration
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  public async store({ request, bouncer, auth, response }: HttpContext) {

     const { author, title, source, content, tags, places, legacy_id } = request.all()
    const user_id = auth.user!.id

    let create_data = {author, title, source, content, user_id}
    if (!!legacy_id) {
      // keep the old ID
      // @ts-ignore
      create_data = {author, title, source, content, user_id, legacy_id}
    }

    // checks if create data items are empty and inserts default values
    if (!create_data.author) {
      create_data.author = 'Unknown'
    }
    if (!create_data.title) {
      create_data.title = 'Untitled'
    }
    if (!create_data.content) {
      create_data.content = 'No description'
    }

    // console.log(create_data)

    const illustration = await Illustration.create(create_data)
    if (tags && tags.length > 0) {
      const newTags = [...new Set(tags)].map(tag => {
        return { slug: TagSlugSanitizer(tag+'-'+auth.user?.id), name: tag, user_id: auth.user?.id }
      })
      // console.log(newTags)
      // @ts-ignore
      const allTags = await Tag.fetchOrCreateMany('slug', newTags)
      await illustration.related('tags').saveMany(await allTags)
    } else {
      const newTags = [{ slug: TagSlugSanitizer('untitled-' + auth.user?.id), name: 'untitled', user_id: auth.user?.id }]
      // @ts-ignore
      const allTags = await Tag.fetchOrCreateMany('slug', newTags)
      await illustration.related('tags').saveMany(await allTags)
    }
    // console.log(illustration)

    if (places && places.length > 0) {
      places.map(async (place: Partial<{ id: number; user_id: number; createdAt: DateTime<boolean>; updatedAt: DateTime<boolean>; illustration_id: number; place: string; location: string; used: DateTime<boolean> }>) => {
        await Place.create({...place, illustration_id: illustration.id, user_id})
      })
    }

    return response.send({message: 'Created successfully', id: illustration.id})
  }

    /**
   * Update illustration details.
   * PUT or PATCH illustration/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
    public async update({ params, auth, bouncer, request, response }: HttpContext) {
    const { author, title, source, content, tags } = request.all()
    // places are on their own URI. Tags can be in the illustration post

    let illustration = await Illustration.findByOrFail('id', _.get(params, 'id', 0))

    if (await bouncer.denies(editIllustration, illustration)) {
      return response.forbidden({message: 'E_AUTHORIZATION_FAILURE: Not authorized to perform this action'})
    }

    illustration.author = author
    illustration.title = title
    illustration.source = source
    illustration.content = content

    await illustration.save()

    if (tags && tags.length > 0) {
      const newTags = [...new Set(tags)].map(tag => {
        return { slug: TagSlugSanitizer(tag+'-'+auth.user?.id), name: tag, user_id: auth.user?.id }
      })
      // console.log(newTags)
      // @ts-ignore
      const allTags = await Tag.fetchOrCreateMany('slug', newTags)
      await illustration.related('tags').detach()
      await illustration.related('tags').saveMany(await allTags)
    }

    const returnValue = await illustration.toJSON()
    returnValue.tags = await tags

    return response.send({message: 'Updated successfully', illustration: returnValue})
  }

    /**
   * Delete a illustration with id.
   * DELETE illustration/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  public async destroy({ params, auth, response }: HttpContext) {

    let id = _.get(params, 'id', 0)
    let illustration = await Illustration.query().where('id',id)

    if (illustration[0].user_id != auth.user?.id) {
      return response.status(403).send({ message: 'You do not have permission to access this resource' })
    }

    await Place.query().where('illustration_id', id).delete()
    await Upload.query().where('illustration_id', id).delete()
    const uploadsPath = app.makePath('uploads', env.get("NODE_ENV"), auth.user?.id.toString(), id.toString()) // delete just the illustration folder
    await fs.rm(uploadsPath, { recursive: true, force: true })

    await illustration[0].related('tags').detach()
    await illustration[0].delete()
    return response.send({message: `Deleted illustration id: ${illustration[0].id}`})
  }

}
