/**
 * SearchIndexingService
 *
 * Asynchronous indexing worker responsibilities:
 * - Compute embeddings
 * - Compute FTS vectors
 * - Update document_search table
 *
 * Called by job queue when documents are created/updated
 */

import db from '@adonisjs/lucid/services/db'
import Illustration from '#models/illustration'

export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>
}

export class SearchIndexingService {
  private embeddingProvider: EmbeddingProvider

  constructor(embeddingProvider: EmbeddingProvider) {
    this.embeddingProvider = embeddingProvider
  }

  /**
   * Index a single illustration
   *
   * Steps:
   * 1. Load illustration
   * 2. Compute title+body embedding
   * 3. Build FTS vectors
   * 4. Update or create document_search record
   */
  async indexIllustration(illustrationId: number): Promise<void> {
    const illustration = await Illustration.find(illustrationId)
    if (!illustration) {
      throw new Error(`Illustration not found: ${illustrationId}`)
    }

    // Combine text for embedding
    const textForEmbedding = this.prepareEmbeddingText(illustration)
    const textForFTS = this.prepareFTSText(illustration)

    // Compute embedding
    const embedding = await this.embeddingProvider.embed(textForEmbedding)

    // Upsert document_search record
    await this.upsertSearchIndex(illustrationId, {
      title_tsv: this.buildTSVectorSQL('english', illustration.title),
      body_tsv: this.buildTSVectorSQL('english', illustration.content),
      title_trigram: illustration.title,
      embedding,
      created_at: illustration.createdAt,
      updated_at: new Date()
    })
  }

  /**
   * Re-index all illustrations (use with caution)
   */
  async reindexAll(): Promise<void> {
    const illustrations = await Illustration.all()

    for (const illustration of illustrations) {
      try {
        await this.indexIllustration(illustration.id)
      } catch (error) {
        console.error(`Failed to index illustration ${illustration.id}:`, error)
      }
    }
  }

  /**
   * Delete search index for an illustration
   */
  async deleteIndex(illustrationId: number): Promise<void> {
    await db.rawQuery(
      'DELETE FROM document_search WHERE document_id = ?',
      [illustrationId]
    )
  }

  /**
   * Upsert document_search record
   */
  private async upsertSearchIndex(
    documentId: number,
    data: {
      title_tsv: string
      body_tsv: string
      title_trigram: string
      embedding: number[]
      created_at: any
      updated_at: Date
    }
  ): Promise<void> {
    // Build SQL expressions for tsvector and embedding so Postgres
    // receives proper typed values (to_tsvector(...) and vector literal)
    const titleTsvExpr = data.title_tsv
    const bodyTsvExpr = data.body_tsv
    const embeddingExpr = this.buildEmbeddingLiteral(data.embedding)

    // PostgreSQL UPSERT with ON CONFLICT
    const sql = `
      INSERT INTO document_search (
        document_id,
        title_tsv,
        body_tsv,
        title_trigram,
        embedding,
        created_at,
        updated_at
      ) VALUES (?, ${titleTsvExpr}, ${bodyTsvExpr}, ?, ${embeddingExpr}, ?, ?)
      ON CONFLICT (document_id)
      DO UPDATE SET
        title_tsv = EXCLUDED.title_tsv,
        body_tsv = EXCLUDED.body_tsv,
        title_trigram = EXCLUDED.title_trigram,
        embedding = EXCLUDED.embedding,
        updated_at = EXCLUDED.updated_at
    `

    await db.rawQuery(sql, [
      documentId,
      data.title_trigram,
      data.created_at,
      data.updated_at
    ])
  }

  /**
   * Build a Postgres vector literal for pgvector insertion.
   * Example result: '[0.1,0.2,0.3]'::vector
   */
  private buildEmbeddingLiteral(embedding: number[]): string {
    const parts = embedding.map((n) => {
      if (!isFinite(n)) return '0'
      return String(n)
    })
    return `'[${parts.join(',')}]'::vector`
  }

  /**
   * Prepare text for embedding
   * Combines title, content, and author info
   */
  private prepareEmbeddingText(illustration: Illustration): string {
    const parts = [
      illustration.title,
      illustration.content,
      illustration.author || ''
    ]
    return parts.filter(p => p && p.trim()).join(' ')
  }

  /**
   * Prepare text for full-text search
   */
  private prepareFTSText(illustration: Illustration): string {
    return `${illustration.title} ${illustration.content} ${illustration.author || ''}`
  }

  /**
   * Build PostgreSQL tsvector from text
   * Uses to_tsvector function for proper tokenization
   */
  private buildTSVectorSQL(language: string, text: string): string {
    // Escape single quotes
    const escaped = text.replace(/'/g, "''")
    return `to_tsvector('${language}', '${escaped}')`
  }

  /**
   * Update view count (for popularity boost)
   */
  async incrementViewCount(documentId: number, count: number = 1): Promise<void> {
    await db.rawQuery(
      `UPDATE document_search SET view_count = view_count + ? WHERE document_id = ?`,
      [count, documentId]
    )
  }

  /**
   * Update user interaction score (for affinity boost)
   */
  async updateUserInteractionScore(documentId: number, score: number): Promise<void> {
    await db.rawQuery(
      `UPDATE document_search SET user_interaction_score = ? WHERE document_id = ?`,
      [score, documentId]
    )
  }
}
