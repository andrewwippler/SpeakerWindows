import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import _ from 'lodash'
import Tag from 'App/Models/Tag'
import TagValidator from 'App/Validators/TagValidator'

export default class TagsController {

  /**
   * Show a list of all tags.
   * GET tags
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  public async index({ auth }: HttpContextContract) {
    return await Tag.query().where('user_id', `${auth.user?.id}`).orderBy('name')
  }

    /**
   * search tags.
   * GET tags/:name
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  public async search({ params, auth, response }: HttpContextContract) {

    const tag = _.get(params, 'name', '')

    // assuming bad data can be sent here. Raw should parameterize input
    // https://security.stackexchange.com/q/172297/35582
    // @ts-ignore
    const tagQuery = await Tag.query().whereRaw('name LIKE ?', `${tag}%`).andWhere('user_id', `${auth.user?.id}`).orderBy('name')


    if (tagQuery.length < 1) {
      return response.status(204).send({ message: 'no results found' })
    }

    return tagQuery
  }

   /**
   * Illustrations for tag.
   * GET tag/:name
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
   public async illustrations({ params, auth }: HttpContextContract) {

    const thetag = _.get(params, 'name', '')

     //@tag.illustrations
    const tag = await Tag.findByOrFail('name', thetag);
    const tagQuery = await tag.related('illustrations').query().where('user_id', `${auth.user?.id}`)

    if (tagQuery.length < 1) {
      return {
        id: tag.id,
        name: tag.name
      }
    }

     const returnTags = {
       id: tag.id,
       name: tag.name,
       illustrations: tagQuery,
    }


    return returnTags
  }

  /**
   * Update tag details.
   * PUT or PATCH tags/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  public async update({ bouncer, params, request, response }: HttpContextContract) {

    const { name } = request.all()

    try {
      await request.validate(TagValidator)
   } catch (error) {
     return response.status(400).send(error.messages)
   }
    // places are on their own URI. Tags can be in the illustration post

    let tag = await Tag.findOrFail(params.id)

    await bouncer.authorize('updateTag', tag)

    tag.name = name
    tag.slug = '' // empty to redo the slug

    await tag.save()

    return response.send({message: 'Updated successfully'})

  }

  /**
   * Delete a tag with id.
   * DELETE tags/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  public async destroy({ params, auth, response }: HttpContextContract) {

    let tag = await Tag.findOrFail(params.id)

    if (!tag.toJSON()[0] && tag.user_id != auth.user?.id) {
      return response.status(403).send({ message: 'You do not have permission to access this resource' })
    }

    await tag.delete()
    return response.send({message: `Deleted tag id: ${tag.id}`})
  }

}
