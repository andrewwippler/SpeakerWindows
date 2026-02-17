import type { HttpContext } from '@adonisjs/core/http'
import _ from 'lodash'
import Tag from '#models/tag'
import { TagValidator } from '#validators/TagValidator'
import { editTag } from '#app/abilities/main'

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
  public async index({ auth }: HttpContext) {
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
  public async search({ params, auth, response }: HttpContext) {
    const tag = _.get(params, 'name', '')
    const user_id = `${auth.user?.id}`

    // assuming bad data can be sent here. Raw should parameterize input
    // https://security.stackexchange.com/q/172297/35582
    // @ts-ignore
    const tagQuery = await Tag.query()
      .where('name', 'ILIKE', `${tag}%`)
      .andWhere('user_id', user_id)
      .orderBy('name')
      .limit(10)

    // console.log({
    //   message: 'debug', user_id, searchString: tag, data: tagQuery
    //   , data2: tagQuery
    // })
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
  public async illustrations({ params, auth }: HttpContext) {
    const thetag = _.get(params, 'name', '')

    //@tag.illustrations
    const tag = await Tag.findByOrFail('name', thetag)
    const tagQuery = await tag
      .related('illustrations')
      .query()
      .where('user_id', `${auth.user?.id}`)
      .orderBy('title')

    if (tagQuery.length < 1) {
      return {
        id: tag.id,
        name: tag.name,
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
  public async update({ auth, bouncer, params, request, response }: HttpContext) {
    const { name } = request.all()

    try {
      await request.validateUsing(TagValidator, {
        meta: { userId: auth.user!.id },
      })
    } catch (error) {
      return response.status(400).send(error.messages)
    }

    let tag = await Tag.findOrFail(params.id)

    if (await bouncer.denies(editTag, tag)) {
      return response.forbidden({
        message: 'E_AUTHORIZATION_FAILURE: Not authorized to perform this action',
      })
    }

    // Check if another tag with the same name already exists for this user
    const existingTag = await Tag.query()
      .where('slug', name + '-' + auth.user!.id)
      .first()

    if (existingTag) {
      return response
        .status(400)
        .send([{ message: 'Cannot update tag with the same name of an existing tag' }])
    }
    // Safe to update
    tag.name = name
    tag.slug = '' // trigger slug regeneration
    await tag.save()

    return response.send({ message: 'Updated successfully' })
  }

  /**
   * Delete a tag with id.
   * DELETE tags/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  public async destroy({ params, auth, response }: HttpContext) {
    let tag = await Tag.findOrFail(params.id)

    if (!tag.toJSON()[0] && tag.user_id != auth.user?.id) {
      return response
        .status(403)
        .send({ message: 'You do not have permission to access this resource' })
    }

    await tag.delete()
    return response.send({ message: `Deleted tag id: ${tag.id}` })
  }

  /**
   * Remove illustrations from a tag.
   * DELETE tags/:id/illustrations
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  public async removeIllustrations({ params, auth, bouncer, request, response }: HttpContext) {
    const tag = await Tag.findOrFail(params.id)

    if (await bouncer.denies(editTag, tag)) {
      return response.status(403).send({
        message: 'You do not have permission to access this resource',
      })
    }

    const { illustration_ids } = request.only(['illustration_ids'])

    if (!Array.isArray(illustration_ids) || illustration_ids.length === 0) {
      return response.status(400).send({
        message: 'illustration_ids must be a non-empty array',
      })
    }

    const illustrations = await tag.related('illustrations').query().whereIn('illustrations.id', illustration_ids)

    await tag.related('illustrations').detach(illustrations.map((i) => i.id))

    return response.send({
      message: `Removed ${illustrations.length} illustrations from tag`,
    })
  }
}
