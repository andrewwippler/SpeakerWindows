/**
 * IndexIllustrationJob
 *
 * Async background job to index a newly created/updated illustration
 *
 * Handles:
 * - Computing embeddings
 * - Building FTS vectors
 * - Updating document_search table
 *
 * Triggered when:
 * - Illustration created
 * - Illustration updated
 * - Manual reindex requested
 */

import { SearchIndexingService } from '#services/search_indexing_service'

export interface IndexIllustrationJobPayload {
  illustrationId: number
  priority?: 'low' | 'normal' | 'high'
}

/**
 * Simple in-process job handler
 * For production, integrate with Bull Queue or other queue system
 */
export class IndexIllustrationJob {
  private indexingService: SearchIndexingService

  constructor(embeddingProvider: any) {
    this.indexingService = new SearchIndexingService(embeddingProvider)
  }

  /**
   * Process the indexing job
   */
  async handle(payload: IndexIllustrationJobPayload): Promise<void> {
    try {
      await this.indexingService.indexIllustration(payload.illustrationId)
      console.log(`[IndexJob] Successfully indexed illustration ${payload.illustrationId}`)
    } catch (error) {
      console.error(`[IndexJob] Failed to index illustration ${payload.illustrationId}:`, error)
      throw error
    }
  }

  /**
   * Retry strategy
   */
  async onFailure(payload: IndexIllustrationJobPayload, error: Error): Promise<void> {
    console.error(`[IndexJob] Index failed for ${payload.illustrationId}, retrying...`, error)
    // Could implement exponential backoff here
  }
}
