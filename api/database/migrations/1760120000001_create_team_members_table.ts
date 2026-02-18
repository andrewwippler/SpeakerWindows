import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'team_members'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('team_id').unsigned().notNullable().references('teams.id').onDelete('CASCADE')
      table.integer('user_id').unsigned().notNullable().references('users.id').onDelete('CASCADE')
      table.enum('role', ['owner', 'creator', 'editor', 'readonly']).notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.unique(['team_id', 'user_id'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
