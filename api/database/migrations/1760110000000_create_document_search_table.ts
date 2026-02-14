import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'document_search'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('document_id').unsigned().notNullable().unique()
      table.foreign('document_id').references('id').inTable('illustrations').onDelete('CASCADE')

      // Full-text search vectors
      table.specificType('title_tsv', 'tsvector').nullable()
      table.specificType('body_tsv', 'tsvector').nullable()

      // Trigram indexed title for fuzzy search
      table.string('title_trigram', 500).nullable()

      // Vector embedding for semantic search
      table.specificType('embedding', 'vector(1536)').nullable()

      // Metadata for ranking
      table.timestamp('created_at').nullable()
      table.timestamp('updated_at').nullable()
      table.integer('view_count').defaultTo(0)
      table.integer('user_interaction_score').defaultTo(0)
    })

    // GIN indexes for full-text search
    this.schema.raw(`
      CREATE INDEX ${this.tableName}_title_tsv_idx
      ON ${this.tableName} USING gin(title_tsv)
    `)

    this.schema.raw(`
      CREATE INDEX ${this.tableName}_body_tsv_idx
      ON ${this.tableName} USING gin(body_tsv)
    `)

    // GIN index for trigram fuzzy search
    this.schema.raw(`
      CREATE INDEX ${this.tableName}_title_trigram_idx
      ON ${this.tableName} USING gin(title_trigram gin_trgm_ops)
    `)

    // IVFFlat index for vector similarity search
    // Requires pgvector extension
    this.schema.raw(`
      CREATE INDEX ${this.tableName}_embedding_idx
      ON ${this.tableName} USING ivfflat(embedding vector_cosine_ops)
      WITH (lists = 100)
    `)
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
