import type { HttpContext } from '@adonisjs/core/http'
import _ from 'lodash'
import Illustration from '#models/illustration'
import Tag from '#models/tag'
import Place from '#models/place'
import LocalEmbeddingProvider from '#services/local_embedding_provider'
import { RankingService } from '#services/ranking_service'
import { HybridSearchValidator } from '#validators/hybrid_search_validator'

export default class SearchController {
  public async index({ view }: HttpContext) {
    return view.render('search/index', {
      illustrations: [],
      tags: [],
      places: [],
      query: '',
    })
  }

  public async query({ auth, request, view }: HttpContext) {
    const query = String(request.input('query', '')).trim()
    const userId = `${auth.user?.id}`
    const limit = Number(request.input('limit', 50))

    if (!query) {
      return view.render('search/index', {
        illustrations: [],
        tags: [],
        places: [],
        query: '',
      })
    }

    try {
      // Step 1: Retrieve candidates independently from all methods
      const queryEmbedding = await LocalEmbeddingProvider.embed(query)
      const ranker = new RankingService()

      const hybridSearch = {
        retrieve: async (_query: string, _queryEmbedding: number[]) => [],
      }
      const candidates = await hybridSearch.retrieve(query, queryEmbedding)

      let sortedResults: any[] = []

      // Only run vector candidate loading and ranking if candidates are found
      if (candidates.length > 0) {
        // Step 2: Load illustrations for ranking and response
        const candidateIds = candidates.map((c: any) => c.illustrationId)
        const illustrations = await Illustration.query()
          .whereIn('id', candidateIds)
          .where('user_id', userId)

        // Create map for ranking - use String keys to match Lucid serialization
        const illustrationMap = new Map(illustrations.map((il) => [String(il.id), il]))

        // Step 3: Rank illustrations with RRF + boosting
        const rankedResults = await ranker.rank(candidates, illustrationMap)

        // Step 4: Sort by title match first (search string in title), then alphabetically
        sortedResults = ranker.sortByTitleMatchFirst(rankedResults, query)
      }

      // Step 5: Limit ranked results
      const limitedIllustrations = sortedResults.slice(0, limit).map((r) => r.illustration)

      // Step 5b: Fetch illustrations where content matches LIKE query (prepend to results)
      const contentMatches = await Illustration.query()
        .where('content', 'LIKE', `%${query}%`).orWhere('title', 'LIKE', `%${query}%`)
        .where('user_id', userId)
        .limit(limit)

      const contentMatchIds = new Set(contentMatches.map((il: any) => il.id))
      const dedupedLimited = limitedIllustrations.filter((il: any) => !contentMatchIds.has(il.id))
      const finalIllustrations = [...contentMatches, ...dedupedLimited].slice(0, limit)

      // Step 6: Fetch tags (case-insensitive)
      const tagSanitizedSearch = `${_.kebabCase(query)}-${userId}`
      const qLower = query.toLowerCase()
      const tagSlugLower = tagSanitizedSearch.toLowerCase()
      const tags = await Tag.query()
        .where((builder) => {
          builder
            .whereRaw('LOWER(name) LIKE ?', [`%${qLower}%`])
            .orWhereRaw('LOWER(slug) LIKE ?', [`%${tagSlugLower}%`])
        })
        .andWhere('user_id', userId)

      // Step 7: Fetch places
      const places = await Place.query()
        .preload('illustration')
        .where('place', 'LIKE', `%${query}%`)
        .andWhere('user_id', userId)

      return view.render('search/results', { illustrations: finalIllustrations, tags, places, query })
    } catch (error) {
      console.error('Search error:', error)
      return view.render('search/results', {
        illustrations: [],
        tags: [],
        places: [],
        query,
      })
    }
}
}
