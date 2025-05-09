import type { HttpContext } from '@adonisjs/core/http'
import Illustration from '#models/illustration'
import _ from 'lodash'

export default class AuthorsController {

  /**
   * Displays all authors for illustrations
   * GET illustration/authors
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  public async index({ auth, response }: HttpContext) {

    const illustrationQuery = await Illustration.query()
      .select('author')
      .whereNotNull('author')
      .andWhere("author", "<>", "")
      .andWhere('user_id', `${auth.user?.id}`)
      .distinct('author')
      .orderBy('author')

    // console.log({ message: 'author', user_id: `${auth.user?.id}`, data: illustrationQuery })
    if (illustrationQuery.length < 1) {
      return response.status(204).send({ message: 'no results found' })
    }

    return illustrationQuery
  }

    /**
   * Displays all authors on illustrations
   * GET /author/:name
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  public async show({ params, auth, response }: HttpContext) {

    const theauthor = decodeURI(_.get(params, 'name', ''))

      const illustrationQuery = await Illustration.query()
        .where('author', theauthor)
        .andWhere('user_id', `${auth.user?.id}`)
        .orderBy('title')

      if (illustrationQuery.length < 1) {
        return response.status(204).send({ message: 'no results found' })
      }

      return illustrationQuery
    }

  /**
   * Updates the author of all illustrations
   * PUT /author/:name
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  public async update({ params, auth, request, response }: HttpContext) {
    const theauthor = decodeURI(_.get(params, 'name', ''))
    const newauthor = decodeURI(_.get(request.all(), 'author', ''))

    if (theauthor === newauthor) {
      return response.status(400).send({ message: 'no changes made' })
    }

    const illustrationQuery = await Illustration.query()
      .where('author', theauthor)
      .andWhere('user_id', `${auth.user?.id}`)
      .update({ author: newauthor })

    if (illustrationQuery.length < 1) {
      return response.status(204).send({ message: 'no results found' })
    }

    return response.ok({ message: `Author updated from ${theauthor} to ${newauthor}` })
  }
}
