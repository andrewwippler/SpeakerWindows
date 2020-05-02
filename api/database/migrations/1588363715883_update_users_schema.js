'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const { empty } = require('uuidv4');

class UpdateUsersSchema extends Schema {
  up () {
    this.table('users', (table) => {
      // alter table
      table.string('uid').unique().default(empty()).notNull()
      table.dropColumn('reset_password_token')
      table.dropColumn('reset_password_sent_at')
      table.dropColumn('remember_created_at')
      table.dropColumn('current_sign_in_at')
      table.dropColumn('last_sign_in_at')
      table.dropColumn('current_sign_in_ip')
      table.dropColumn('last_sign_in_ip')

    })
  }

  down () {
    this.table('users', (table) => {
      // reverse alternations
      table.dropColumn('uid')
      table.string('reset_password_token')
      table.datetime('reset_password_sent_at')
      table.datetime('remember_created_at')
      table.datetime('current_sign_in_at')
      table.datetime('last_sign_in_at')
      table.string('current_sign_in_ip')
      table.string('last_sign_in_ip')
    })
  }
}

module.exports = UpdateUsersSchema
