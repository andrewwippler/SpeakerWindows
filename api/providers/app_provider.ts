import { type ApplicationService } from '@adonisjs/core/types'
import LocalEmbeddingProvider from '#services/local_embedding_provider'
import edge from 'edge.js'

export default class AppProvider {
  constructor(protected app: ApplicationService) { }

  public register() {
    // No bindings needed - using direct imports with singleton pattern
  }

  public async boot() {
    edge.global('titleCase', (text: string) => {
      if (typeof text !== 'string' || !text.trim()) {
        return '' // Ensures Edge renders an empty string instead of literal "undefined"
      }
      return text
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    })
    edge.global('excerpt', (text: unknown, max = 250): string => {
      const str = String(text ?? '')
        .replace(/\s+/g, ' ')
        .trim()
      if (str.length <= max) return str
      return `${str.slice(0, max).trimEnd()}…`
    })
    edge.global('highlight', (text: string, query?: string | null) => {
      if (!text) return ''

      const strText = String(text)

      if (!query || !query.trim()) {
        return strText
      }

      // Escape regex special characters from search query
      const escapedQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`(${escapedQuery})`, 'gi')

      const highlighted = strText.replace(regex, '<strong>$1</strong>')

      // Use edge.raw() directly
      return highlighted
    })
    // Warm up the embedding model on boot to avoid first-request delay
    try {
      await LocalEmbeddingProvider.warmUp()
      console.log('Embedding model warmed up successfully')
    } catch (error) {
      console.error('Failed to warm up embedding model:', error)
    }
  }

  public async ready() { }

  public async shutdown() { }
}
