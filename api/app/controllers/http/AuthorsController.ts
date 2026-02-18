import type { HttpContext } from '@adonisjs/core/http'
import Illustration from '#models/illustration'
import TeamMember from '#models/team_member'
import Team from '#models/team'
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
  public async index({ auth, request, response }: HttpContext) {
    const teamIdQuery = request.qs().team_id
    let teamId: number | null = null
    if (teamIdQuery !== undefined && teamIdQuery !== 'null') {
      teamId = Number(teamIdQuery)
    }

    const userId = auth.user?.id

    let builder = Illustration.query()
      .select('author')
      .whereNotNull('author')
      .andWhere('author', '<>', '')
      .andWhere('user_id', `${userId}`)
      .distinct('author')
      .orderBy('author')

    if (teamId !== null) {
      const isMember = await TeamMember.query()
        .where('team_id', teamId)
        .where('user_id', userId)
        .first()

      const team = await Team.find(teamId)
      const isOwner = team?.userId === userId

      if (!isMember && !isOwner) {
        return response.status(403).send({ message: 'Not a team member' })
      }

      builder = Illustration.query()
        .select('author')
        .whereNotNull('author')
        .andWhere('author', '<>', '')
        .andWhere('team_id', teamId)
        .distinct('author')
        .orderBy('author')
    }

    const illustrationQuery = await builder

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
  public async show({ params, auth, request, response }: HttpContext) {
    const theauthor = decodeURI(_.get(params, 'name', ''))
    const teamIdQuery = request.qs().team_id
    const userId = auth.user?.id

    let builder = Illustration.query()
      .where('author', theauthor)
      .andWhere('user_id', `${userId}`)
      .orderBy('title')

    if (teamIdQuery && teamIdQuery !== 'null') {
      const teamId = Number(teamIdQuery)

      const isMember = await TeamMember.query()
        .where('team_id', teamId)
        .where('user_id', userId)
        .first()

      const team = await Team.find(teamId)
      const isOwner = team?.userId === userId

      if (!isMember && !isOwner) {
        return response.status(403).send({ message: 'Not a team member' })
      }

      builder = Illustration.query()
        .where('author', theauthor)
        .andWhere('team_id', teamId)
        .orderBy('title')
    }

    const illustrationQuery = await builder

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
