import type { HttpContext } from '@adonisjs/core/http'
import Illustration from '#models/illustration'
import Tag from '#models/tag'
import Place from '#models/place'
import LocalEmbeddingProvider from '#services/local_embedding_provider'

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

    if (!query) {
      return view.render('search/index', {
        illustrations: [],
        tags: [],
        places: [],
        query: '',
      })
    }

    try {
      const embedding = await LocalEmbeddingProvider.embed(query)
      const illustrations = await Illustration.search(query, embedding, { limit: 50 })

      const tags = await Tag.query()
        .whereRaw('LOWER(name) LIKE ?', [`%${query.toLowerCase()}%`])
        .andWhere('user_id', userId)

      const places = await Place.query()
        .preload('illustration')
        .where('place', 'LIKE', `%${query}%`)
        .andWhere('user_id', userId)

      return view.render('search/index', { illustrations, tags, places, query })
    } catch (error) {
      console.error('Search error:', error)
      return view.render('search/index', {
        illustrations: [],
        tags: [],
        places: [],
        query,
      })
    }
  }
}
