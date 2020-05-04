'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
const Tag = use('App/Models/Tag')

const _ = require('lodash')
/**
 * Resourceful controller for interacting with tags
 */
class TagController {
  /**
   * Show a list of all tags.
   * GET tags
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index({auth}) {
    return await Tag.query().where('user_id', `${auth.user.id}`).orderBy('name').fetch()
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
  async search({ params, auth, response }) {

    const tag = _.get(params, 'name', '')

    // assuming bad data can be sent here. Raw should parameterize input
    // https://security.stackexchange.com/q/172297/35582
    const tagQuery = await Tag.query().whereRaw('name LIKE ?', `${tag}%`).andWhere('user_id', `${auth.user.id}`).orderBy('name').fetch()

    if (tagQuery.toJSON().length < 1) {
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
  async update({ params, auth, request, response }) {

    const { name } = request.post()
    // places are on their own URI. Tags can be in the illustration post

    let tag = await Tag.find(params.id)

    if (!tag.toJSON()[0] && tag.user_id != auth.user.id) {
      return response.status(403).send({ message: 'You do not have permission to access this resource' })
    }

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
  async destroy({ params, auth, response }) {

    let tag = await Tag.find(params.id)

    if (!tag.toJSON()[0] && tag.user_id != auth.user.id) {
      return response.status(403).send({ message: 'You do not have permission to access this resource' })
    }

    await tag.delete()
    return response.send({message: `Deleted tag id: ${tag.id}`})
  }
}

module.exports = TagController
