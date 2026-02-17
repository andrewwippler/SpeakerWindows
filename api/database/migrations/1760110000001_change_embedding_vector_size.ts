import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'document_search'

  public async up() {
    this.schema.raw(`
      ALTER TABLE ${this.tableName} DROP COLUMN IF EXISTS embedding
    `)

    this.schema.alterTable(this.tableName, (table) => {
      table.specificType('embedding', 'vector(384)').nullable()
    })

    this.schema.raw(`
      CREATE INDEX ${this.tableName}_embedding_idx
      ON ${this.tableName} USING ivfflat(embedding vector_cosine_ops)
      WITH (lists = 100)
    `)
  }

  public async down() {
    this.schema.raw(`
      ALTER TABLE ${this.tableName} DROP COLUMN IF EXISTS embedding
    `)

    this.schema.alterTable(this.tableName, (table) => {
      table.specificType('embedding', 'vector(1536)').nullable()
    })

    this.schema.raw(`
      CREATE INDEX ${this.tableName}_embedding_idx
      ON ${this.tableName} USING ivfflat(embedding vector_cosine_ops)
      WITH (lists = 100)
    `)
  }
}
