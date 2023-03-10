import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import _ from 'lodash'
import Tag from 'App/Models/Tag'

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
    return await Tag.query().where('user_id', `${auth.user.id}`).orderBy('name')
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
    const tagQuery = await Tag.query().whereRaw('name LIKE ?', `${tag}%`).andWhere('user_id', `${auth.user.id}`).orderBy('name')


    if (tagQuery.length < 1) {
      return response.status(204).send({ message: 'no results found' })
    }

    return tagQuery
  }

  /**
   * Update tag details.
   * PUT or PATCH tags/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  public async update({ bouncer, params, auth, request, response }: HttpContextContract) {

    const { name } = request.all()
    // places are on their own URI. Tags can be in the illustration post

    let tag = await Tag.findOrFail(params.id)

    await bouncer.authorize('updateTag', tag)

    tag.name = name

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

    let tag = await Tag.find(params.id)

    if (!tag.toJSON()[0] && tag.user_id != auth.user.id) {
      return response.status(403).send({ message: 'You do not have permission to access this resource' })
    }

    await tag.delete()
    return response.send({message: `Deleted tag id: ${tag.id}`})
  }

}
