import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = 'users'

  public async up () {
    this.schema.table(this.tableName, (table) => {
      // alter table
      table.renameColumn('encrypted_password', 'password')
      table.string('uid').unique().defaultTo('00000000-0000-0000-0000-000000000000').notNullable()
      table.dropColumn('reset_password_token')
      table.dropColumn('reset_password_sent_at')
      table.dropColumn('remember_created_at')
      table.dropColumn('current_sign_in_at')
      table.dropColumn('last_sign_in_at')
      table.dropColumn('current_sign_in_ip')
      table.dropColumn('last_sign_in_ip')
      table.dropColumn('sign_in_count')
    })
  }

  public async down () {
    this.schema.table(this.tableName, (table) => {
      // reverse alternations
      table.renameColumn('password', 'encrypted_password')
      table.dropColumn('uid')
      table.string('reset_password_token')
      table.datetime('reset_password_sent_at')
      table.datetime('remember_created_at')
      table.datetime('current_sign_in_at')
      table.datetime('last_sign_in_at')
      table.string('current_sign_in_ip')
      table.string('last_sign_in_ip')
      table.integer('sign_in_count').defaultTo(0).notNullable()
    })
  }
}
