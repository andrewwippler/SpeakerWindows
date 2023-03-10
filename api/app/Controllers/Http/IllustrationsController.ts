import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Illustration from 'App/Models/Illustration'
import Place from 'App/Models/Place'
import Tag from 'App/Models/Tag'
import { _ } from 'lodash'

export default class IllustrationsController {


  /**
   * Displays places associated to an illustration.
   * GET illustrations/:illustration_id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  public async show({ params, auth, response }: HttpContextContract) {

    const illustrationQuery = await Illustration.query()
      .where('id', _.get(params, 'id', 0))
      .andWhere('user_id', `${auth.user.id}`)
      .preload('tags', (builder) => {
        builder.orderBy('name', 'asc')
      })
      .preload('places', (builder) => {
        builder.orderBy('used', 'asc')
      })

      // console.log(_.get(params, 'id', 0),auth.user.id,!!illustrationQuery[0],!illustrationQuery[0])
      if (!!illustrationQuery[0]) {
        const illustration = illustrationQuery[0].toJSON();
        return illustration
      }
      return response.status(403).send({ message: 'You do not have permission to access this resource' })


  }

    /**
   * Create/save a new illustration.
   * POST illustrations
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  public async store({ request, auth, response }: HttpContextContract) {

    const { author, title, source, content, tags, places } = request.all()
    const user_id = auth.user.id
    const illustration = await Illustration.create({author, title, source, content, user_id})
    if (tags && tags.length > 0) {
      tags.map(async tag => {
        const tg = await Tag.firstOrCreate({ name: tag, user_id: auth.user.id })
        await illustration.related('tags').attach([tg.id])
      })
    }

    if (places && places.length > 0) {
      places.map(async (place) => {
        await Place.create({...place, illustration_id: illustration.id, user_id})
      })
    }

    return response.send({message: 'Created successfully', id: illustration.id})
  }

    /**
   * Update illustration details.
   * PUT or PATCH illustrations/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
    public async update({ params, auth, request, response }: HttpContextContract) {
    const { author, title, source, content, tags } = request.all()
    // places are on their own URI. Tags can be in the illustration post

    let illustration = await Illustration.findBy('id', _.get(params, 'id', 0))

    if (illustration.user_id != auth.user.id) {
      return response.status(403).send({ message: 'You do not have permission to access this resource' })
    }

    illustration.author = author
    illustration.title = title
    illustration.source = source
    illustration.content = content

    await illustration.save()

    if (tags && tags.length > 0) {
      // drop the tags and re-add them
      await illustration.related('tags').detach()
      let newTags = []
      tags.map(async tag => {
        const tg = await Tag.firstOrNew({ name: tag, user_id: auth.user.id })
        newTags.push(tg.id)
      })

      await illustration.related('tags').attach(newTags)

    }
    const returnValue = await illustration.toJSON()
    returnValue.tags = await tags

    return response.send({message: 'Updated successfully', illustration: returnValue})
  }

    /**
   * Delete a illustration with id.
   * DELETE illustrations/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  public async destroy({ params, auth, response }: HttpContextContract) {

    let id = _.get(params, 'id', 0)
    let illustration = await Illustration.query().where('id',id)

    if (illustration[0].user_id != auth.user.id) {
      return response.status(403).send({ message: 'You do not have permission to access this resource' })
    }

    await Place.query().where('illustration_id', id).delete()
    await illustration[0].related('tags').detach()
    await illustration[0].delete()
    return response.send({message: `Deleted illustration id: ${illustration[0].id}`})
  }

}
