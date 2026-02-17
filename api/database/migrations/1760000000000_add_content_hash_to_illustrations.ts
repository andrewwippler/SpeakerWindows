import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'illustrations'

  public async up() {
    this.schema.table(this.tableName, (table) => {
      table.string('content_hash', 128).nullable()
      table.unique(
        ['user_id', 'source', 'content_hash'],
        'illustrations_user_source_content_hash_unique'
      )
    })
  }

  public async down() {
    this.schema.table(this.tableName, (table) => {
      table.dropUnique(
        ['user_id', 'source', 'content_hash'],
        'illustrations_user_source_content_hash_unique'
      )
      table.dropColumn('content_hash')
    })
  }
}
