/**
 * HybridSearchController
 *
 * Endpoints for production hybrid search with:
 * - Multi-method retrieval (FTS title, FTS body, fuzzy, semantic)
 * - RRF ranking
 * - Boosting
 * - Results with detailed scoring
 */

import type { HttpContext } from '@adonisjs/core/http'
import HybridSearchService from '#services/hybrid_search_service'
import { RankingService } from '#services/ranking_service'
import Illustration from '#models/illustration'
import Tag from '#models/tag'
import Place from '#models/place'
import _ from 'lodash'
import { HybridSearchValidator } from '#validators/HybridSearchValidator'

export default class HybridSearchController {
  private hybridSearch = HybridSearchService
  private ranker = new RankingService()

  /**
   * POST /api/search/hybrid
   *
   * Hybrid search with text + optional embedding
   * Returns Illustrations, Tags, and Places matching the query
   *
   * Body:
   * {
   *   query: string (required)
   *   embedding?: number[] (optional, 1536-dim for e.g., OpenAI/Ollama)
   *   limit?: number (default: 50)
   *   includeDetails?: boolean (default: false) - include scoring breakdown
   * }
   *
   * Response:
   * {
   *   message: 'success'
   *   searchString: string
   *   data: {
   *     illustrations: Illustration[]
   *     tags: Tag[]
   *     places: Place[]
   *   }
   * }
   */
  async search({ auth, request, response }: HttpContext) {
    const validated = await request.validateUsing(HybridSearchValidator)

    const { query, embedding: userEmbedding, limit = 50 } = validated

    try {
      // Step 1: Retrieve candidates independently from all methods
      const candidates = await this.hybridSearch.retrieve(
        query,
        userEmbedding || this.getDefaultEmbedding()
      )

      if (candidates.length === 0) {
        return response.send({
          message: 'success',
          searchString: query,
          data: {
            illustrations: [],
            places: [],
            tags: [],
          },
        })
      }

      // Step 2: Load illustrations for ranking and response
      // Step 2: Load illustrations for ranking and response
      const illustrations = await Illustration.query()
        .whereIn(
          'id',
          candidates.map((c: any) => c.illustrationId)
        )
        .where('user_id', auth.user?.id)

      // Create map for ranking - use String keys to match Lucid serialization
      const illustrationMap = new Map(illustrations.map((il) => [String(il.id), il]))

      // Step 3: Rank illustrations with RRF + boosting
      const rankedResults = await this.ranker.rank(candidates, illustrationMap)

      // Step 4: Sort by title match first (search string in title), then alphabetically
      const sortedResults = this.ranker.sortByTitleMatchFirst(rankedResults, query)

      // Step 5: Limit ranked results
      const limitedIllustrations = sortedResults.slice(0, limit).map((r) => r.illustration)

      // Step 5: Fetch tags (case-insensitive)
      const tagSanitizedSearch = _.kebabCase(query) + '-' + (auth.user?.id || '0')
      const qLower = query.toLowerCase()
      const tagSlugLower = tagSanitizedSearch.toLowerCase()
      const tags = await Tag.query()
        .where((builder) => {
          builder
            .whereRaw('LOWER(name) LIKE ?', [`%${qLower}%`])
            .orWhereRaw('LOWER(slug) LIKE ?', [`%${tagSlugLower}%`])
        })
        .andWhere('user_id', `${auth.user?.id}`)

      // Step 6: Fetch places
      const places = await Place.query()
        .preload('illustration')
        .where('place', 'LIKE', `%${query}%`)
        .andWhere('user_id', `${auth.user?.id}`)

      return response.send({
        message: 'success',
        searchString: query,
        data: {
          illustrations: limitedIllustrations,
          places,
          tags,
        },
      })
    } catch (error) {
      console.error('Hybrid search error:', error)
      return response.internalServerError({
        error: 'Search failed',
        message: (error as any).message,
      })
    }
  }

  /**
   * Helper: Get default embedding for searches without semantic component
   * Returns zero vector (384 dimensions)
   */
  private getDefaultEmbedding(): number[] {
    return Array(384).fill(0)
  }
}
