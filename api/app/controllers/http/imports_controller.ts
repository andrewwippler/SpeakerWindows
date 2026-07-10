import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import crypto, { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import { ImportService } from '#services/import_service'
import Illustration from '#models/illustration'
import Tag from '#models/tag'
import Team from '#models/team'
import TeamMember from '#models/team_member'
import TagSlugSanitizer from '#app/helpers/tag'
import { SearchIndexingService } from '#services/search_indexing_service'
import LocalEmbeddingProvider from '#services/local_embedding_provider'

export default class ImportsController {
  public async store({ auth, request, response }: HttpContext) {
    const importer = request.input('importer')
    const validImporters = ['readwise', 'koreader', 'playbooks', 'kindle']
    if (!validImporters.includes(importer)) {
      return response.badRequest({
        message: `Invalid importer type. Must be one of: ${validImporters.join(', ')}`,
      })
    }

    const extMap: Record<string, string[]> = {
      readwise: ['csv'],
      koreader: ['json'],
      playbooks: ['html', 'docx'],
      kindle: ['pdf'],
    }
    const allowedExts = extMap[importer]

    const sentFile = request.file('file', {
      size: '50mb',
      extnames: allowedExts,
    })

    if (!sentFile) {
      return response.badRequest({ message: 'No file uploaded' })
    }

    if (!sentFile.isValid) {
      return response.badRequest(sentFile.errors)
    }

    const tmpDir = app.tmpPath('imports')
    await fs.mkdir(tmpDir, { recursive: true })
    const fileName = `${randomUUID()}.${sentFile.extname}`
    await sentFile.move(tmpDir, { name: fileName })
    const filePath = `${tmpDir}/${fileName}`

    let illustrations: import('#services/import_service').ImportIllustration[]
    try {
      illustrations = await ImportService.parse(filePath, importer)
    } catch (err: any) {
      await fs.unlink(filePath).catch(() => {})
      return response.badRequest({ message: `Failed to parse file: ${err.message}` })
    }

    const userId = auth.user!.id

    let userRole: string | null = null
    let userTeamId: number | null = null

    const allMemberships = await TeamMember.query().where('user_id', userId)
    for (const membership of allMemberships) {
      const team = await Team.find(membership.teamId)
      if (team && team.userId !== userId) {
        userTeamId = membership.teamId
        userRole = membership.role
        break
      }
    }

    if (!userTeamId) {
      const ownedTeam = await Team.query().where('user_id', userId).first()
      if (ownedTeam) {
        userTeamId = ownedTeam.id
        userRole = 'owner'
      }
    }

    let shouldBePrivate = true
    if (userRole === 'owner' || userRole === 'creator') {
      shouldBePrivate = false
    }

    const finalTeamId: number | null = !shouldBePrivate && userTeamId ? userTeamId : userTeamId

    let imported = 0
    let duplicates = 0
    let errors = 0

    for (const ill of illustrations) {
      try {
        const createData: any = {
          author: ill.author || 'Unknown',
          title: ill.title || 'Untitled',
          source: ill.source || '',
          content: ill.content || 'No description',
          user_id: userId,
          team_id: finalTeamId,
          private: shouldBePrivate,
        }

        const normalizedContent = createData.content
          .toString()
          .trim()
          .replace(/\s+/g, ' ')
          .toLowerCase()
        const contentHash = crypto.createHash('sha256').update(normalizedContent).digest('hex')

        const existing = await Illustration.query()
          .where('user_id', userId)
          .where('source', createData.source)
          .andWhere('content_hash', contentHash)
          .first()

        if (existing) {
          duplicates++
          continue
        }

        createData.content_hash = contentHash

        const illustration = await Illustration.create(createData)

        const tagList = ill.tags || []
        if (tagList.length > 0) {
          const newTags = [...new Set(tagList)].map((tag) => ({
            slug: TagSlugSanitizer(
              tag + '-' + userId + (finalTeamId ? '-team-' + finalTeamId : '')
            ),
            name: tag,
            user_id: userId,
            team_id: finalTeamId ?? null,
          }))
          const allTags = await Tag.fetchOrCreateMany('slug', newTags)
          await illustration.related('tags').saveMany(allTags)
        } else {
          const defaultTag = [
            {
              slug: TagSlugSanitizer(
                'untitled-' + userId + (finalTeamId ? '-team-' + finalTeamId : '')
              ),
              name: 'untitled',
              user_id: userId,
              team_id: finalTeamId ?? null,
            },
          ]
          const allTags = await Tag.fetchOrCreateMany('slug', defaultTag)
          await illustration.related('tags').saveMany(allTags)
        }

        try {
          const indexingService = new SearchIndexingService(LocalEmbeddingProvider)
          await indexingService.indexIllustration(illustration.id)
        } catch (err) {
          console.error('Indexing failed for imported illustration:', err)
        }

        imported++
      } catch (err) {
        console.error('Error creating illustration from import:', err)
        errors++
      }
    }

    await fs.unlink(filePath).catch(() => {})

    const total = illustrations.length
    return response.ok({
      message: `Imported ${imported} of ${total} highlights`,
      imported,
      duplicates,
      errors,
      total,
    })
  }
}
