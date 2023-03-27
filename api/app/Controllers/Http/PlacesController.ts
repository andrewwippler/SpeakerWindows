import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Place from 'App/Models/Place'
import Illustration from 'App/Models/Illustration'
import { _ } from 'lodash'

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
  public async show({ bouncer, params,  }: HttpContextContract) {
    const places = await Place.findByOrFail('illustration_id', params.illustration_id)

    await bouncer.authorize('viewPlace', places)

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
  public async store({ params, auth, request, response }: HttpContextContract) {

    const posted = request.all()

    const illustration = await Illustration.findOrFail(params.illustration_id)

    if (!illustration) {
      return response.status(403).send({ message: 'Illustration does not exist' })
    }

    if (!illustration.toJSON()[0] && illustration.user_id != auth.user?.id) {
      return response.status(403).send({ message: 'You do not have permission to access this resource' })
    }

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
  public async update({ params, auth, request, response }: HttpContextContract) {

    const post = request.post()

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
  public async destroy({ params, auth, response }: HttpContextContract) {

    let place = await Place.findOrFail(params.id)

    if (place.user_id != auth.user?.id) {
      return response.status(403).send({message: 'You do not have permission to access this resource'})
    }
    await place.delete()
    return response.send({message: `Deleted place id: ${place.id}`})
  }
}
