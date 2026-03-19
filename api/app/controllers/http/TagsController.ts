import type { HttpContext } from '@adonisjs/core/http'
import _ from 'lodash'
import Tag from '#models/tag'
import TeamMember from '#models/team_member'
import Team from '#models/team'
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
  public async index({ auth, request }: HttpContext) {
    const rawTeamId = request.input('team_id')
    const teamId = rawTeamId ? Number(rawTeamId) : null
    const user = auth.user! // Assuming user is logged in

    if (!teamId) {
      // Fetch personal tags where team_id is null
      return await Tag.query()
        .where('user_id', user.id) // Lucid handles the mapping to user_id
        .whereNull('team_id')
        .orderBy('name', 'asc')
    }

    // Check if user belongs to the team via a relationship query (more efficient)
    const isMember = await Team.query()
      .where('id', teamId)
      .where((query) => {
        query.where('user_id', user.id).orWhereHas('members', (m) => {
          m.where('user_id', user.id)
        })
      })
      .first()

    if (!isMember) {
      return []
    }

    const tagsToReturn = await Tag.query().where('team_id', teamId).orderBy('name', 'asc')

    // loop over tagsToReturn and remove duplicate tags with the same name, keeping the one with the lowest id
    // in teams, it's possible to have multiple tags with the same name but different ids. We want to return only one tag per unique name, and we want to keep the one with the lowest id (the first one created).
    const uniqueTagsMap: Record<string, Tag> = {}
    tagsToReturn.forEach((tag) => {
      if (!uniqueTagsMap[tag.name]) {
        uniqueTagsMap[tag.name] = tag
      } else {
        if (tag.id < uniqueTagsMap[tag.name].id) {
          uniqueTagsMap[tag.name] = tag
        }
      }
    })

    return Object.values(uniqueTagsMap)
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
  public async search({ params, auth, request, response }: HttpContext) {
    const tag = _.get(params, 'name', '')
    const user_id = `${auth.user?.id}`
    const teamIdQuery = request.input('team_id')
    let teamId: number | null = null
    if (teamIdQuery !== undefined && teamIdQuery !== '' && teamIdQuery !== 'null') {
      teamId = Number(teamIdQuery)
    }

    // assuming bad data can be sent here. Raw should parameterize input
    // https://security.stackexchange.com/q/172297/35582
    // @ts-ignore
    let tagQuery = Tag.query()
      .where('name', 'ILIKE', `${tag}%`)
      .andWhere('user_id', user_id)
      .orderBy('name')
      .limit(10)

    if (teamId === null) {
      tagQuery = tagQuery.andWhereNull('team_id')
    } else {
      tagQuery = tagQuery.andWhere('team_id', teamId)
    }

    const results = await tagQuery

    // console.log({
    //   message: 'debug', user_id, searchString: tag, data: tagQuery
    //   , data2: tagQuery
    // })
    if (results.length < 1) {
      return response.status(204).send({ message: 'no results found' })
    }

    return results
  }

  /**
   * Get the Illustrations listed under a given tag.
   * GET tag/:name
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   * @returns {object} tag details and associated illustrations
   */
  public async illustrations({ params, auth, request, response }: HttpContext) {
    const thetag = _.get(params, 'name', '')
    const teamIdQuery = request.input('team_id')

    const userId = auth.user?.id

    let tags: Tag[] = []
    let teamTag: Tag | null = null
    let personalTag: Tag | null = null

    if (teamIdQuery && teamIdQuery !== 'null') {
      const teamId = Number(teamIdQuery)

      if (String(teamId) !== String(userId)) {
        const isMember = await TeamMember.query()
          .where('team_id', teamId)
          .where('user_id', userId)
          .first()

        const team = await Team.find(teamId)
        const isOwner = team?.userId === userId

        if (!isMember && !isOwner) {
          return response.status(403).send({ message: 'Not a team member' })
        }
      }

      teamTag = await Tag.query().where('name', 'ILIKE', thetag).where('team_id', teamId).first()
      if (teamTag) {
        tags.push(teamTag)
      }

      // Also get ALL other tags with the same name (same name, different IDs)
      const allTeamTags = await Tag.query()
        .where('name', 'ILIKE', thetag)
        .where('team_id', teamId)
      for (const t of allTeamTags) {
        if (!tags.find((existing) => existing.id === t.id)) {
          tags.push(t)
        }
      }
    }

    personalTag = await Tag.query()
      .where('name', 'ILIKE', thetag)
      .where('user_id', userId)
      .whereNull('team_id')
      .first()

    if (personalTag) {
      tags.push(personalTag)
    }

    // Also get ALL personal tags with the same name
    const allPersonalTags = await Tag.query()
      .where('name', 'ILIKE', thetag)
      .where('user_id', userId)
      .whereNull('team_id')
    for (const t of allPersonalTags) {
      if (!tags.find((existing) => existing.id === t.id)) {
        tags.push(t)
      }
    }

    if (tags.length === 0) {
      return response.status(404).send({ message: 'Tag not found' })
    }

    const illustrationMap = new Map<number, any>()
    for (const tag of tags) {
      const tagIllustrations = await tag.related('illustrations').query().orderBy('title')
      for (const ill of tagIllustrations) {
        if (!illustrationMap.has(ill.id)) {
          illustrationMap.set(ill.id, ill)
        }
      }
    }

    const mergedIllustrations = Array.from(illustrationMap.values()).sort((a, b) =>
      a.title.localeCompare(b.title)
    )

    if (mergedIllustrations.length === 0) {
      return {
        id: tags[0].id,
        name: tags[0].name,
      }
    }

    return {
      id: tags[0].id,
      name: tags[0].name,
      illustrations: mergedIllustrations,
    }
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

    // Check if another tag with the same name already exists for this user and team
    const teamPart = tag.team_id ? '-team-' + tag.team_id : ''
    const existingTag = await Tag.query()
      .where('slug', name + '-' + auth.user!.id + teamPart)
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
  public async removeIllustrations({ params, bouncer, request, response }: HttpContext) {
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

    const illustrations = await tag
      .related('illustrations')
      .query()
      .whereIn('illustrations.id', illustration_ids)

    await tag.related('illustrations').detach(illustrations.map((i) => i.id))

    return response.send({
      message: `Removed ${illustrations.length} illustrations from tag`,
    })
  }
}
