import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Illustration from 'App/Models/Illustration'
import { _ } from 'lodash'

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
  public async index({ auth, response }: HttpContextContract) {

    const illustrationQuery = await Illustration.query()
      .select('author')
      .whereNotNull('author')
      .andWhere("author", "<>", "")
      .andWhere('user_id', `${auth.user?.id}`)
      .distinct('author')
      .orderBy('author')

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
  public async show({ params, auth, response }: HttpContextContract) {

    const theauthor = decodeURI(_.get(params, 'name', ''))

    console.log(theauthor)

      const illustrationQuery = await Illustration.query()
        .where('author', theauthor)
        .andWhere('user_id', `${auth.user?.id}`)
        .orderBy('title')

      if (illustrationQuery.length < 1) {
        return response.status(204).send({ message: 'no results found' })
      }

      return illustrationQuery
    }


}
