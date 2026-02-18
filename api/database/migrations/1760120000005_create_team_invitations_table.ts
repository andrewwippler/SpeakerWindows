import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'team_invitations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('team_id').unsigned().references('teams.id').onDelete('CASCADE')
      table.integer('user_id').unsigned().references('users.id').onDelete('CASCADE')
      table.enum('role', ['creator', 'editor', 'readonly']).defaultTo('readonly')
      table.enum('status', ['pending', 'accepted', 'declined']).defaultTo('pending')
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
