import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'illustrations'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('team_id').unsigned().nullable().references('teams.id').onDelete('SET NULL')
      table.boolean('private').notNullable().defaultTo(false)
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('team_id')
      table.dropColumn('private')
    })
  }
}
