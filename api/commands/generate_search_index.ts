import { BaseCommand, flags } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import db from '@adonisjs/lucid/services/db'

export default class GenerateSearchIndex extends BaseCommand {
  static commandName = 'generate:search-index'
  static description = 'Generate missing document_search records for illustrations'

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

  async run() {
    const limit = this.limit
    const userId = this.userId

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

  private async indexIllustration(illustration: any): Promise<void> {
    const titleTrigram = illustration.title || ''

    const embedding: number[] = Array(1536).fill(0)

    const sql = `
    INSERT INTO document_search (
      document_id,
      title_tsv,
      body_tsv,
      title_trigram,
      embedding,
      created_at,
      updated_at
    ) VALUES (
      ?,
      to_tsvector('english', ?),
      to_tsvector('english', ?),
      ?,
      ?,
      ?,
      ?
    )
    ON CONFLICT (document_id) DO NOTHING
  `

    // Pass the embedding array as a parameter; pgvector will accept it
    await db.rawQuery(sql, [
      illustration.id,
      illustration.title || '',
      illustration.content || '',
      titleTrigram,
      embedding,             // Pass the array directly
      illustration.created_at,
      new Date(),
    ])
  }

}
