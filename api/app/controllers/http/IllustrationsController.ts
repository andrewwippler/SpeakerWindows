import type { HttpContext } from '@adonisjs/core/http'
import TagSlugSanitizer from '#app/helpers/tag'
import Illustration from '#models/illustration'
import crypto from 'crypto'
import Place from '#models/place'
import Tag from '#models/tag'
import { SearchIndexingService } from '#services/search_indexing_service'
import LocalEmbeddingProvider from '#services/local_embedding_provider'
import _ from 'lodash'
import { DateTime } from 'luxon'
import {
  canEditIllustration,
  canEditIllustrationContent,
  canDeleteIllustration,
  canViewIllustration,
} from '#app/abilities/main'
import Upload from '#models/upload'
import app from '@adonisjs/core/services/app'
import fs from 'fs/promises'
import env from '#start/env'
import TeamMember from '#models/team_member'
import Team from '#models/team'
import User from '#models/user'

async function getUserTeamIds(userId: number): Promise<number[]> {
  const memberships = await TeamMember.query().where('user_id', userId)
  return memberships.map((m) => m.teamId)
}

async function getUserRoleInTeam(userId: number, teamId: number): Promise<string | null> {
  const membership = await TeamMember.query()
    .where('team_id', teamId)
    .where('user_id', userId)
    .first()
  return membership?.role || null
}

export default class IllustrationsController {
  /**
   * Displays places associated to an illustration.
   * GET illustration/:illustration_id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  public async show({ params, auth, response }: HttpContext) {
    // validate id to avoid DB errors on out-of-range values
    const rawId = _.get(params, 'id', 0)
    const id = parseInt(rawId, 10) || 0
    if (id > 2147483647 || id < -2147483648) {
      return response.status(500).send({ message: 'Invalid id' })
    }

    let illustrationQuery
    try {
      illustrationQuery = await Illustration.query()
        .where('id', id)
        .preload('tags', (builder) => {
          builder.orderBy('name', 'asc')
        })
        .preload('places', (builder) => {
          builder.orderBy('used', 'asc')
        })
        .preload('uploads', (builder) => {
          builder.orderBy('name', 'asc')
        })

      if (!illustrationQuery[0]) {
        return response.status(404).send({ message: 'Illustration not found' })
      }

      const illustration = illustrationQuery[0]

      // Check if user can view
      const canView = await canViewIllustration(auth.user!, illustration)
      if (!canView) {
        return response
          .status(403)
          .send({ message: 'You do not have permission to access this resource' })
      }

      // Get user role for this illustration's team
      let userRole: string | null = null
      if (illustration.team_id) {
        userRole = await getUserRoleInTeam(auth.user!.id, illustration.team_id)
      }

      const result = illustration.toJSON()
      result.userRole = userRole

      return result
    } catch (err) {
      return response.status(500).send({ message: 'Database error' })
    }
  }

  /**
   * Displays illustration associated with the old system.
   * (Backwards compatibility)
   * GET illustrations/:illustration_id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  public async showOld({ params, auth, response }: HttpContext) {
    const rawId = _.get(params, 'id', 0)
    const id = parseInt(rawId, 10) || 0
    if (id > 2147483647 || id < -2147483648) {
      return response.status(500).send({ message: 'Invalid id' })
    }

    let illustrationQuery
    try {
      illustrationQuery = await Illustration.query()
        .where('legacy_id', id)
        .andWhere('user_id', `${auth.user?.id}`)
        .preload('tags', (builder) => {
          builder.orderBy('name', 'asc')
        })
        .preload('places', (builder) => {
          builder.orderBy('used', 'asc')
        })
        .preload('uploads', (builder) => {
          builder.orderBy('name', 'asc')
        })

      // console.log(_.get(params, 'id', 0),auth.user?.id,!!illustrationQuery[0],!illustrationQuery[0])
      if (!!illustrationQuery[0]) {
        const illustration = illustrationQuery[0].toJSON()
        return illustration
      }
      return response
        .status(403)
        .send({ message: 'You do not have permission to access this resource' })
    } catch (err) {
      return response.status(500).send({ message: 'Database error' })
    }
  }

  /**
   * Create/save a new illustration.
   * POST /illustration
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  public async store({ request, bouncer, auth, response }: HttpContext) {
    const {
      author,
      title,
      source,
      content,
      tags,
      places,
      legacy_id,
      private: isPrivate,
      team_id,
    } = request.all()
    const user_id = auth.user!.id

    // Get user's team membership to determine role
    let userRole: string | null = null
    let userTeamId: number | null = null

    // First check if user is a member of any team (not their own)
    // Check all memberships and find one where team.user_id != user_id

    const allMemberships = await TeamMember.query()
      .where('user_id', user_id)

    for (const membership of allMemberships) {
      const team = await Team.find(membership.teamId)
      if (team && team.userId !== user_id) {
        userTeamId = membership.teamId
        userRole = membership.role
        break
      }
    }

    // If not a member of someone else's team, check if user owns a team
    if (!userTeamId) {
      const ownedTeam = await Team.query().where('user_id', user_id).first()
      if (ownedTeam) {
        userTeamId = ownedTeam.id
        userRole = 'owner'
      }
    }

    // Determine default private setting based on role
    // Owner/Creator can create team illustrations (private = false)
    // Editor/ReadOnly must create private illustrations (private = true)
    let shouldBePrivate = isPrivate
    if (shouldBePrivate === undefined || shouldBePrivate === null) {
      // Default based on role
      if (userRole === 'owner' || userRole === 'creator') {
        shouldBePrivate = false
      } else {
        shouldBePrivate = true
      }
    }

    // If creating for a team, check permissions
    let finalTeamId: number | null = null
    if (team_id) {
      const role = await getUserRoleInTeam(user_id, team_id)
      if (role && ['owner', 'creator'].includes(role)) {
        finalTeamId = team_id
        // If team illustration, it can't be private
        shouldBePrivate = false
      } else {
        // User can't create for this team, create as private instead
        finalTeamId = userTeamId
        shouldBePrivate = true
      }
    } else if (!shouldBePrivate && userTeamId) {
      // Not explicitly set to private, use user's team
      finalTeamId = userTeamId
    } else if (shouldBePrivate && userTeamId) {
      // Private illustration, use user's team
      finalTeamId = userTeamId
    }

    let create_data: any = {
      author,
      title,
      source,
      content,
      user_id,
      team_id: finalTeamId,
      private: shouldBePrivate,
    }
    if (!!legacy_id) {
      create_data = {
        author,
        title,
        source,
        content,
        user_id,
        legacy_id,
        team_id: finalTeamId,
        private: shouldBePrivate,
      }
    }

    // checks if create data items are empty and inserts default values
    if (!create_data.author) {
      create_data.author = 'Unknown'
    }
    if (!create_data.title) {
      create_data.title = 'Untitled'
    }
    if (!create_data.content) {
      create_data.content = 'No description'
    }

    // normalize content and compute hash for duplicate detection
    const normalizedContent = (create_data.content || '')
      .toString()
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase()
    const content_hash = crypto.createHash('sha256').update(normalizedContent).digest('hex')
    // check for duplicates for this user and source
    const existing = await Illustration.query()
      .where('user_id', user_id)
      .where('source', create_data.source || '')
      .andWhere('content_hash', content_hash)
      .first()

    if (existing) {
      return response.status(409).send({ message: 'Duplicate illustration', id: existing.id })
    }

    // include hash in create payload
    create_data.content_hash = content_hash

    const illustration = await Illustration.create(create_data)
    if (tags && tags.length > 0) {
      const newTags = [...new Set(tags)].map((tag) => {
        return {
          slug: TagSlugSanitizer(
            tag + '-' + auth.user?.id + (finalTeamId ? '-team-' + finalTeamId : '')
          ),
          name: tag,
          user_id: auth.user?.id,
          team_id: finalTeamId ?? null,
        }
      })
      // console.log(newTags)
      // @ts-ignore
      const allTags = await Tag.fetchOrCreateMany('slug', newTags)
      await illustration.related('tags').saveMany(await allTags)
    } else {
      const newTags = [
        {
          slug: TagSlugSanitizer(
            'untitled-' + auth.user?.id + (finalTeamId ? '-team-' + finalTeamId : '')
          ),
          name: 'untitled',
          user_id: auth.user?.id,
          team_id: finalTeamId ?? null,
        },
      ]
      // @ts-ignore
      const allTags = await Tag.fetchOrCreateMany('slug', newTags)
      await illustration.related('tags').saveMany(await allTags)
    }
    // console.log(illustration)

    if (places && places.length > 0) {
      places.map(
        async (
          place: Partial<{
            id: number
            user_id: number
            createdAt: DateTime<boolean>
            updatedAt: DateTime<boolean>
            illustration_id: number
            place: string
            location: string
            used: DateTime<boolean>
          }>
        ) => {
          await Place.create({ ...place, illustration_id: illustration.id, user_id })
        }
      )
    }

    // Trigger immediate indexing so hybrid search index is available for subsequent requests/tests
    try {
      const indexingService = new SearchIndexingService(LocalEmbeddingProvider)
      await indexingService.indexIllustration(illustration.id)
    } catch (err) {
      console.error('Indexing failed for new illustration:', err)
    }

    return response.send({ message: 'Created successfully', id: illustration.id })
  }

  public async bulk({ request, response, auth }: HttpContext) {
    const { illustrations: illustrationIds, action, data } = request.all()

    if (!illustrationIds || !Array.isArray(illustrationIds) || illustrationIds.length === 0) {
      return response.badRequest({ message: 'illustrations array is required' })
    }

    if (!action || !['toggle_privacy', 'remove_tag'].includes(action)) {
      return response.badRequest({
        message: 'Invalid action. Must be toggle_privacy or remove_tag',
      })
    }

    const illustrations = await Illustration.query().whereIn('id', illustrationIds)

    if (illustrations.length !== illustrationIds.length) {
      return response.badRequest({ message: 'One or more illustrations not found' })
    }

    if (action === 'toggle_privacy') {
      const newPrivacy = data === true

      for (const illustration of illustrations) {
        const canToggle = await this.canTogglePrivacy(auth.user!, illustration)
        if (!canToggle) {
          return response.status(403).send({
            message: `You do not have permission to change privacy of illustration ${illustration.id}`,
          })
        }
        illustration.private = newPrivacy
        await illustration.save()
      }

      return response.send({ message: `Updated privacy for ${illustrations.length} illustrations` })
    }

    if (action === 'remove_tag') {
      const tagName = data

      if (!tagName || typeof tagName !== 'string') {
        return response.badRequest({ message: 'Tag name is required for remove_tag action' })
      }

      for (const illustration of illustrations) {
        const canRemoveTag = await this.canRemoveTag(auth.user!, illustration)
        if (!canRemoveTag) {
          return response.status(403).send({
            message: `You do not have permission to remove tags from illustration ${illustration.id}`,
          })
        }

        const tags = await illustration.related('tags').query()
        const tagToRemove = tags.find((t) => t.name.toLowerCase() === tagName.toLowerCase())

        if (!tagToRemove) {
          return response.badRequest({
            message: `Tag "${tagName}" not found on illustration ${illustration.id}`,
          })
        }

        if (tags.length === 1) {
          return response.badRequest({
            message: `Cannot remove the last tag from illustration ${illustration.id}`,
          })
        }

        await illustration.related('tags').detach([tagToRemove.id])
      }

      return response.send({
        message: `Removed tag "${tagName}" from ${illustrations.length} illustrations`,
      })
    }

    return response.badRequest({ message: 'Invalid action' })
  }

  private async canTogglePrivacy(user: User, illustration: Illustration): Promise<boolean> {
    return _.toInteger(user.id) === _.toInteger(illustration.user_id)
  }

  private async canRemoveTag(user: User, illustration: Illustration): Promise<boolean> {
    if (_.toInteger(user.id) === _.toInteger(illustration.user_id)) {
      return true
    }

    if (illustration.team_id) {
      const team = await Team.find(illustration.team_id)
      if (team && _.toInteger(team.userId) === _.toInteger(user.id)) {
        return true
      }

      const role = await getUserRoleInTeam(user.id, illustration.team_id)
      if (role && ['owner', 'creator', 'editor'].includes(role)) {
        return true
      }
    }

    return false
  }

  /**
   * Update illustration details.
   * PUT or PATCH illustration/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  public async update({ params, auth, request, response }: HttpContext) {
    const allParams = request.all()
    const author = allParams.author
    const title = allParams.title
    const source = allParams.source
    const content = allParams.content
    const tags = allParams.tags
    const isPrivate = allParams.private

    const body = request.body() || {}
    const hasAuthor = 'author' in body
    const hasTitle = 'title' in body
    const hasSource = 'source' in body
    const hasContent = 'content' in body
    const hasTags = 'tags' in body
    const hasPrivate = 'private' in body

    let illustration = await Illustration.findByOrFail('id', _.get(params, 'id', 0))

    const canEdit = await canEditIllustration(auth.user!, illustration)
    if (!canEdit) {
      return response.forbidden({
        message: 'E_AUTHORIZATION_FAILURE: Not authorized to perform this action',
      })
    }

    const canEditContent = await canEditIllustrationContent(auth.user!, illustration)

    if (hasAuthor) {
      illustration.author = author
    }
    if (hasTitle) {
      illustration.title = title
    }
    if (hasSource) {
      illustration.source = source
    }

    if (hasContent && canEditContent) {
      illustration.content = content
    }

    if (hasPrivate && isPrivate !== illustration.private) {
      const userTeam = await Team.query().where('user_id', auth.user!.id).first()

      if (isPrivate === true) {
        illustration.private = true
        if (userTeam) {
          illustration.team_id = userTeam.id
        }
      } else {
        if (illustration.team_id) {
          const role = await getUserRoleInTeam(auth.user!.id, illustration.team_id)
          if (role && ['owner', 'creator'].includes(role)) {
            illustration.private = false
          } else {
            illustration.private = true
          }
        } else {
          illustration.private = false
        }
      }
    }

    await illustration.save()

    if (hasTags && tags && tags.length > 0) {
      const newTags = [...new Set(tags)].map((tag) => {
        return {
          slug: TagSlugSanitizer(
            tag +
              '-' +
              auth.user?.id +
              (illustration.team_id ? '-team-' + illustration.team_id : '')
          ),
          name: tag,
          user_id: auth.user?.id,
          team_id: illustration.team_id ?? null,
        }
      })
      const allTags = await Tag.fetchOrCreateMany('slug', newTags)
      await illustration.related('tags').detach()
      await illustration.related('tags').saveMany(await allTags)
    }

    const returnValue = await illustration.toJSON()
    returnValue.tags = tags
    returnValue.canEditContent = canEditContent

    let userRole: string | null = null
    if (illustration.team_id) {
      userRole = await getUserRoleInTeam(auth.user!.id, illustration.team_id)
    }
    returnValue.userRole = userRole

    try {
      const indexingService = new SearchIndexingService(LocalEmbeddingProvider)
      await indexingService.indexIllustration(illustration.id)
    } catch (err) {
      console.error('Indexing failed for updated illustration:', err)
    }

    return response.send({ message: 'Updated successfully', illustration: returnValue })
  }

  /**
   * Delete a illustration with id.
   * DELETE illustration/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  public async destroy({ params, auth, response }: HttpContext) {
    let id = _.get(params, 'id', 0)
    let illustration = await Illustration.query().where('id', id).first()

    if (!illustration) {
      return response.status(404).send({ message: 'Illustration not found' })
    }

    // Check if user can delete
    const canDelete = await canDeleteIllustration(auth.user!, illustration)
    if (!canDelete) {
      return response
        .status(403)
        .send({ message: 'You do not have permission to delete this resource' })
    }

    await Place.query().where('illustration_id', id).delete()
    await Upload.query().where('illustration_id', id).delete()
    const uploadsPath = app.makePath(
      'uploads',
      env.get('NODE_ENV'),
      auth.user?.id.toString(),
      id.toString()
    )
    await fs.rm(uploadsPath, { recursive: true, force: true })

    await illustration.related('tags').detach()
    await illustration.delete()
    try {
      const indexingService = new SearchIndexingService(LocalEmbeddingProvider)
      await indexingService.deleteIndex(id)
    } catch (err) {
      console.error('Failed to delete search index for illustration', id, err)
    }
    return response.send({ message: `Deleted illustration id: ${illustration.id}` })
  }

  public async index({ auth }: HttpContext) {
    const userId = auth.user?.id

    // Get all team IDs the user belongs to
    const teamIds = await getUserTeamIds(userId)
    // Get illustrations:
    // 1. Own illustrations (user_id matches)
    // 2. Team illustrations (team_id in user's teams AND not private)
    const illustrations = await Illustration.query()
      .where((query) => {
        query.where('user_id', userId)
        if (teamIds.length > 0) {
          query.orWhere((inner) => {
            inner.whereIn('team_id', teamIds).andWhere('private', false)
          })
        }
      })
      .preload('user')
      .orderBy('created_at', 'desc')

    return illustrations
  }

  /**
   * Search illustrations using hybrid search
   * POST /illustrations/search
   *
   * Query parameters:
   * - q: search query (required)
   * - embedding: vector embedding (optional, defaults to zero vector)
   * - limit: max results (optional, default: 50)
   * - details: include scoring breakdown (optional, default: false)
   */
  public async search({ request, auth, response }: HttpContext) {
    const query = request.input('q')
    const embedding = request.input('embedding', Array(384).fill(0))
    const limit = request.input('limit', 50)
    const includeDetails = request.input('details', false)

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return response.badRequest({ error: 'Query parameter "q" is required' })
    }

    try {
      const results = await Illustration.search(query.trim(), embedding, {
        limit,
        includeScores: includeDetails,
      })

      const userId = auth.user!.id
      const teamIds = await getUserTeamIds(userId)

      // Filter to only accessible illustrations
      // 1. Own illustrations (user_id matches)
      // 2. Team illustrations (team_id in user's teams AND not private)
      const userResults = Array.isArray(results)
        ? results.filter((r: any) => {
            const ill = r.illustration || r

            // Always include own illustrations
            if (ill.user_id === userId) {
              return true
            }

            // Don't include private illustrations from others
            if (ill.private) {
              return false
            }

            // Include team illustrations
            if (ill.team_id && teamIds.includes(ill.team_id)) {
              return true
            }

            return false
          })
        : results

      return response.ok({
        results: userResults,
        total: userResults.length,
      })
    } catch (error) {
      console.error('Search error:', error)
      return response.internalServerError({
        error: 'Search failed',
        message: (error as any).message,
      })
    }
  }
}
