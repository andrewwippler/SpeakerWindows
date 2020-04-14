'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AlterPasswordSchema extends Schema {
  up () {
    this.table('users', (table) => {
      // alter table
      table.renameColumn('encrypted_password', 'password')
    })
  }

  down () {
    this.table('users', (table) => {
      // reverse alternations
      table.renameColumn('password', 'encrypted_password')
    })
  }
}

module.exports = AlterPasswordSchema
