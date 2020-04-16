'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class DropSignInCountSchema extends Schema {
  up () {
    this.table('users', (table) => {
      // alter table
      table.dropColumn('sign_in_count')
    })
  }

  down () {
    this.table('users', (table) => {
      // reverse alternations
      table.integer('sign_in_count').defaultTo(0).notNullable()
    })
  }
}

module.exports = DropSignInCountSchema
