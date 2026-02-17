import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'document_search'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.specificType('embedding', 'vector(384)').nullable().alter()
    })

    this.schema.raw(`
      DROP INDEX IF EXISTS ${this.tableName}_embedding_idx
    `)

    this.schema.raw(`
      CREATE INDEX ${this.tableName}_embedding_idx
      ON ${this.tableName} USING ivfflat(embedding vector_cosine_ops)
      WITH (lists = 100)
    `)
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.specificType('embedding', 'vector(1536)').nullable().alter()
    })

    this.schema.raw(`
      DROP INDEX IF EXISTS ${this.tableName}_embedding_idx
    `)

    this.schema.raw(`
      CREATE INDEX ${this.tableName}_embedding_idx
      ON ${this.tableName} USING ivfflat(embedding vector_cosine_ops)
      WITH (lists = 100)
    `)
  }
}
