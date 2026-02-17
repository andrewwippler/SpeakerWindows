import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, manyToMany, belongsTo } from '@adonisjs/lucid/orm'
import _  from 'lodash'
import Place from './place.js'
import Tag from './tag.js'
import User from './user.js'
import Upload from './upload.js'
import type { ManyToMany, BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import hybridSearchService from '#services/hybrid_search_service'
import { RankingService } from '#services/ranking_service'

export default class Illustration extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({
    prepare: (value: string) => _.startCase(value), // uppercase the Title.
  })
  declare title: string

  @column()
  declare author: string | null

  @column()
  declare source: string | null

  @column()
  declare content: string

  @column()
  declare content_hash?: string

  @column()
  declare user_id: number

  @column()
  declare legacy_id: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Place, {
    foreignKey: 'illustration_id'
  })
  declare places: HasMany<typeof Place>

  @manyToMany(() => Tag, {
    pivotTimestamps: true
  })
  declare tags: ManyToMany<typeof Tag>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasMany(() => Upload, {
    foreignKey: 'illustration_id',
  })
  declare uploads: HasMany<typeof Upload>

  private static ranker = new RankingService()

  /**
   * Retrieve candidate illustrations based on hybrid search
   * Returns raw candidate ranks from all 4 methods
   * No scoring or ranking applied at this stage
   */
  static async retrieveCandidates(query: string, embedding: number[]) {
    return await hybridSearchService.retrieve(query, embedding)
  }

  /**
   * High-level search API
   * Orchestrates: retrieval -> ranking -> fetching
   * Returns fully ranked Illustration records
   */
  static async search(
    query: string,
    embedding: number[] = Array(384).fill(0),
    options: { limit?: number; includeScores?: boolean } = {}
  ) {
    const { limit = 50, includeScores = false } = options

    // Step 1: Retrieve candidates with ranks
    const candidates = await this.retrieveCandidates(query, embedding)

    if (candidates.length === 0) {
      return []
    }

    // Step 2: Fetch illustration records
    const illustrations = await Illustration.query()
      .whereIn('id', candidates.map(c => c.illustrationId))

    const illustrationMap = new Map(illustrations.map(il => [il.id, il]))

    // Step 3: Rank with RRF + boosting
    const ranked = await Illustration.ranker.rank(candidates, illustrationMap)

    // Step 4: Return top-K results
    const results = ranked.slice(0, limit)

    if (includeScores) {
      return results
    }

    return results.map(r => r.illustration)
  }

}
