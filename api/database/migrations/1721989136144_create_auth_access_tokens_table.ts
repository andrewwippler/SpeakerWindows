import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'api_tokens'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('tokenable_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table.string('hash').notNullable()
      table.text('abilities').notNullable()
      table.timestamp('updated_at')
      table.timestamp('last_used_at').nullable()
      table.string('name').nullable().alter()
      table.dropColumn('token')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('last_used_at')
      table.dropColumn('updated_at')
      table.dropColumn('abilities')
      table.dropColumn('hash')
      table.dropForeign('tokenable_id')
      table.string('name').notNullable().alter()
      table.string('token', 64).notNullable().unique()
    })
  }

}