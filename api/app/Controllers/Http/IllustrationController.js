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
  async show({ params, request, response, view }) {

    const illustration = await Illustration.find(_.get(params, 'id', 0))

    if (!illustration) {
      return response.status(403).send({ message: 'You are not allowed to access this resource' })
    }

    await illustration.loadMany({
      tags: (builder) => builder.orderBy('name', 'asc'),
      places: (builder) => builder.orderBy('used', 'asc')
    })

    return illustration
  }

    /**
   * Render a form to be used for creating a new tag.
   * GET tags/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create({ request, response, view }) {

    const { author, title, source, content, tags, places } = request.post()

    const illustration = await Illustration.create({author, title, source, content})

    if (tags && tags.length > 0) {
      tags.map(async tag => {
        const tg = await Tag.findOrCreate({ name: tag })
        await illustration.tags().attach(tg.id)
      })
    }

    if (places && places.length > 0) {
      places.map(async (place) => {
        await Place.createPlace(illustration, place)
      })
    }

    return response.send({message: 'Created successfully', id: illustration.id})
  }
}

module.exports = IllustrationController
