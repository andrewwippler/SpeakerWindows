import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'teams'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('invite_code', 10).notNullable().unique()
      table.string('name', 255).notNullable().defaultTo('My Team')
      table.integer('user_id').unsigned().notNullable().references('users.id').onDelete('CASCADE')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.raw('DROP TABLE IF EXISTS team_members CASCADE')
    this.schema.dropTable(this.tableName)
  }
}
