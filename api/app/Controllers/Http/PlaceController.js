'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
const Place = use('App/Models/Place')
const Illustration = use('App/Models/Illustration')
const _ = require('lodash')
class PlaceController {
    /**
   * Displays places associated to an illustration.
   * GET places/:illustration_id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, auth, response }) {
    const places = await Place.query().where({ illustration_id: params.illustration_id, user_id: auth.user.id }).fetch()

    if (!places.toJSON()[0] && places.user_id != auth.user.id) {
      return response.status(403).send({ message: 'You do not have permission to access this resource' })
    }

    return places
  }

  /**
   * Create/save a new place on an existing illustration.
   * POST places/:illustration_id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async store({ params, auth, request, response }) {

    const posted = request.post()
    const illustration_id = _.get(params, 'illustration_id', 0)

    const illustration = await Illustration.find(illustration_id)

    if (!illustration) {
      return response.status(403).send({ message: 'Illustration does not exist' })
    }

    if (!illustration.toJSON()[0] && illustration.user_id != auth.user.id) {
      return response.status(403).send({ message: 'You do not have permission to access this resource' })
    }

    const place = await Place.createPlace(illustration_id, posted, auth.user.id)

    return response.send({message: 'Created successfully', id: place.id})
  }

  /**
   * Update place details.
   * PUT or PATCH places/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, auth, request, response }) {

    const post = request.post()

    let place = await Place.find(params.id)

    place.place = _.get(post, 'place', place.place)
    place.location = _.get(post, 'location', place.location)
    place.used = _.get(post, 'used', place.used)

    if (post.illustration_id != place.illustration_id) {
      return response.status(403).send({message: 'Error: Mismatched illustration_id'})
    }

    if (place.user_id != auth.user.id) {
      return response.status(403).send({message: 'You do not have permission to access this resource'})
    }
    await place.save()

    return response.send({message: 'Updated successfully'})

  }

  /**
   * Delete a place with id.
   * DELETE places/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, auth, response }) {

    let place = await Place.find(params.id)
    if (place.user_id != auth.user.id) {
      return response.status(403).send({message: 'You do not have permission to access this resource'})
    }
    await place.delete()
    return response.send({message: `Deleted place id: ${place.id}`})
  }
}

module.exports = PlaceController
