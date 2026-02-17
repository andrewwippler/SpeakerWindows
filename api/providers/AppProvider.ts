import { ApplicationService } from "@adonisjs/core/types";
import LocalEmbeddingProvider from "#services/local_embedding_provider";

export default class AppProvider {
  constructor(protected app: ApplicationService) {}

  public register() {
    // No bindings needed - using direct imports with singleton pattern
  }

  public async boot() {
    // Warm up the embedding model on boot to avoid first-request delay
    try {
      await LocalEmbeddingProvider.warmUp()
      console.log('Embedding model warmed up successfully')
    } catch (error) {
      console.error('Failed to warm up embedding model:', error)
    }
  }

  public async ready() {
  }

  public async shutdown() {
  }
}
