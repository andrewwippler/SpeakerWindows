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
