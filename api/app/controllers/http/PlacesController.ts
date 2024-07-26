import type { HttpContext } from '@adonisjs/core/http'
import Place from '#models/place'
import Illustration from '#models/illustration'
import _ from 'lodash'
import { viewPlace } from '#app/abilities/main'

export default class PlacesController {
  /**
   * Displays places associated to an illustration.
   * GET places/:illustration_id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  public async show({ bouncer, params, response }: HttpContext) {
    const places = await Place.findByOrFail('illustration_id', params.illustration_id)

    if (await bouncer.denies(viewPlace, places)) {
      return response.forbidden({message: 'E_AUTHORIZATION_FAILURE: Not authorized to perform this action'})
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
  public async store({ params, auth, request, response }: HttpContext) {

    const posted = request.all()
    let illustration
    try {
      illustration = await Illustration.findOrFail(params.illustration_id)
    } catch (error) {
      return response.status(404).send({ message: 'Illustration does not exist' })
    }
    if (!illustration) {
      return response.status(403).send({ message: 'Illustration does not exist' })
    }

    if (!illustration.toJSON()[0] && illustration.user_id != auth.user?.id) {
      return response.status(403).send({ message: 'You do not have permission to access this resource' })
    }

    posted.user_id = auth.user?.id
    const place = await Place.create(posted)
    await illustration.related('places').save(place)
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
  public async update({ params, auth, request, response }: HttpContext) {

    const post = request.body()

    let place = await Place.findOrFail(params.id)

    place.place = _.get(post, 'place', place.place)
    place.location = _.get(post, 'location', place.location)
    place.used = _.get(post, 'used', place.used)

    if (post.illustration_id != place.illustration_id) {
      return response.status(403).send({message: 'Error: Mismatched illustration_id'})
    }

    if (place.user_id != auth.user?.id) {
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
  public async destroy({ params, auth, response }: HttpContext) {

    let place = await Place.findOrFail(params.id)

    if (place.user_id != auth.user?.id) {
      return response.status(403).send({message: 'You do not have permission to access this resource'})
    }
    await place.delete()
    return response.send({message: `Deleted place id: ${place.id}`})
  }
}
