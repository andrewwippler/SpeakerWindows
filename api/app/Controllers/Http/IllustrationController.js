'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */

const Illustration = use('App/Models/Illustration')
const Tag = use('App/Models/Tag')
const Place = use('App/Models/Place')

const _ = require('lodash')

class IllustrationController {

      /**
   * Displays places associated to an illustration.
   * GET illustrations/:illustration_id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, auth, response }) {

    const illustrationQuery = await Illustration.query()
      .where('id', _.get(params, 'id', 0))
      .andWhere('user_id', `${auth.user.id}`)
      .with('tags', (builder) => {
        builder.orderBy('name', 'asc')
      })
      .with('places', (builder) => {
        builder.orderBy('used', 'asc')
      })
      .fetch()

    const illustration = illustrationQuery.toJSON()[0];

    if (!illustration) {
      return response.status(403).send({ message: 'You do not have permission to access this resource' })
    }

    return illustration
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
  async store({ request, auth, response }) {

    const { author, title, source, content, tags, places } = request.post()
    const user_id = auth.user.id
    const illustration = await Illustration.create({author, title, source, content, user_id})
    if (tags && tags.length > 0) {
      tags.map(async tag => {
        const tg = await Tag.findOrCreate({ name: tag, user_id: auth.user.id })
        await illustration.tags().attach(tg.id)
      })
    }

    if (places && places.length > 0) {
      places.map(async (place) => {
        await Place.createPlace(illustration, place, auth.user.id)
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
  async update({ params, auth, request, response }) {
    const { author, title, source, content, tags } = request.post()
    // places are on their own URI. Tags can be in the illustration post

    let illustration = await Illustration.findBy('id', _.get(params, 'id', 0))

    if (!illustration.toJSON()[0] && illustration.user_id != auth.user.id) {
      return response.status(403).send({ message: 'You do not have permission to access this resource' })
    }

    illustration.author = author
    illustration.title = title
    illustration.source = source
    illustration.content = content

    await illustration.save()

    if (tags && tags.length > 0) {
      // drop the tags and re-add them
      await illustration.tags().detach()

      tags.map(async tag => {
        const tg = await Tag.findOrCreate({ name: tag, user_id: auth.user.id })
        await illustration.tags().attach(tg.id)
      })
    }
    const returnValue = illustration.toJSON()
    returnValue.tags = tags

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
  async destroy({ params, auth, response }) {

    let illustration = await Illustration.findBy('id', _.get(params, 'id', 0))

    if (!illustration.toJSON()[0] && illustration.user_id != auth.user.id) {
      return response.status(403).send({ message: 'You do not have permission to access this resource' })
    }

    await illustration.places().delete()
    await illustration.delete()
    return response.send({message: `Deleted illustration id: ${illustration.id}`})
  }
}

module.exports = IllustrationController
