import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  public async up () {
    this.schema.raw('CREATE EXTENSION IF NOT EXISTS pg_trgm;')
  }

  public async down () {
    this.schema.raw('DROP EXTENSION IF EXISTS pg_trgm;')
  }
}
