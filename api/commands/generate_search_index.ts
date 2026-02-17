import { BaseCommand, flags } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import db from '@adonisjs/lucid/services/db'
import LocalEmbeddingProvider from '#services/local_embedding_provider'

export default class GenerateSearchIndex extends BaseCommand {
  static commandName = 'generate:search-index'
  static description = 'Generate or regenerate document_search records for illustrations'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.number({
    description: 'Maximum number of illustrations to index',
    default: 100,
  })
  declare limit: number

  @flags.number({
    description: 'Only process illustrations for a specific user ID',
  })
  declare userId: number | undefined

  @flags.boolean({
    description: 'Also re-index illustrations with zero vectors',
    default: false,
  })
  declare fixZeros: boolean

  async run() {
    const limit = this.limit
    const userId = this.userId
    const fixZeros = this.fixZeros

    if (fixZeros) {
      await this.reindexZeroVectors(userId, limit)
      return
    }

    await this.indexMissing(userId, limit)
  }

  private async indexMissing(userId: number | undefined, limit: number) {
    this.logger.info('Finding illustrations missing from document_search...')

    const sql = userId
      ? `
        SELECT i.id, i.title, i.content, i.author, i.created_at
        FROM illustrations i
        LEFT JOIN document_search ds ON ds.document_id = i.id
        WHERE ds.id IS NULL AND i.user_id = ?
        ORDER BY i.id
        LIMIT ?
      `
      : `
        SELECT i.id, i.title, i.content, i.author, i.created_at
        FROM illustrations i
        LEFT JOIN document_search ds ON ds.document_id = i.id
        WHERE ds.id IS NULL
        ORDER BY i.id
        LIMIT ?
      `

    const params = userId ? [userId, limit] : [limit]
    const results = await db.rawQuery(sql, params)

    const missing = results.rows

    if (missing.length === 0) {
      this.logger.success('No missing illustrations found!')
      return
    }

    this.logger.info(`Found ${missing.length} illustrations to index`)

    let indexed = 0
    for (const illustration of missing) {
      try {
        await this.indexIllustration(illustration)
        indexed++
        if (indexed % 10 === 0) {
          this.logger.info(`Progress: ${indexed}/${missing.length}`)
        }
      } catch (error) {
        this.logger.error(`Failed to index illustration ${illustration.id}: ${error.message}`)
      }
    }

    this.logger.success(`Successfully indexed ${indexed}/${missing.length} illustrations`)
  }

  private async reindexZeroVectors(userId: number | undefined, limit: number) {
    this.logger.info('Finding illustrations with zero vectors...')

    const sql = userId
      ? `
        SELECT i.id, i.title, i.content, i.author, i.created_at, ds.embedding
        FROM illustrations i
        JOIN document_search ds ON ds.document_id = i.id
        WHERE ds.embedding = '[]'::vector AND i.user_id = ?
        ORDER BY i.id
        LIMIT ?
      `
      : `
        SELECT i.id, i.title, i.content, i.author, i.created_at, ds.embedding
        FROM illustrations i
        JOIN document_search ds ON ds.document_id = i.id
        WHERE ds.embedding = '[]'::vector
        ORDER BY i.id
        LIMIT ?
      `

    const params = userId ? [userId, limit] : [limit]
    const results = await db.rawQuery(sql, params)

    const zeroVectors = results.rows

    if (zeroVectors.length === 0) {
      this.logger.success('No illustrations with zero vectors found!')
      return
    }

    this.logger.info(`Found ${zeroVectors.length} illustrations with zero vectors to re-index`)

    let indexed = 0
    for (const illustration of zeroVectors) {
      try {
        await this.indexIllustration(illustration)
        indexed++
        if (indexed % 10 === 0) {
          this.logger.info(`Progress: ${indexed}/${zeroVectors.length}`)
        }
      } catch (error) {
        this.logger.error(`Failed to re-index illustration ${illustration.id}: ${error.message}`)
      }
    }

    this.logger.success(`Successfully re-indexed ${indexed}/${zeroVectors.length} illustrations`)
  }

  private async indexIllustration(illustration: any): Promise<void> {
    const titleTrigram = illustration.title || ''
    const textForEmbedding = `${illustration.title || ''} ${illustration.content || ''} ${illustration.author || ''}`

    let embedding: number[]
    try {
      embedding = await LocalEmbeddingProvider.embed(textForEmbedding)
    } catch (error) {
      this.logger.warn(`Failed to generate embedding for illustration ${illustration.id}, using zeros`)
      embedding = Array(384).fill(0)
    }

    const sql = `
    INSERT INTO document_search (
      document_id,
      title_tsv,
      body_tsv,
      title_trigram,
      embedding,
      created_at
    ) VALUES (
      ?,
      to_tsvector('english', ?),
      to_tsvector('english', ?),
      ?,
      ?,
      ?
    )
    ON CONFLICT (document_id) DO UPDATE SET
      title_tsv = EXCLUDED.title_tsv,
      body_tsv = EXCLUDED.body_tsv,
      title_trigram = EXCLUDED.title_trigram,
      embedding = EXCLUDED.embedding,
      updated_at = NOW()
    `

    await db.rawQuery(sql, [
      illustration.id,
      illustration.title || '',
      illustration.content || '',
      titleTrigram,
      JSON.stringify(embedding),
      illustration.created_at,
    ])
  }

}
