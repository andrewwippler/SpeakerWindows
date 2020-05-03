'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class IllustrationBelongToUsersSchema extends Schema {
  up () {
    this.table('illustrations', (table) => {
      // alter table
      table.string('user_id').index('user_id_on_illustrations')
    })
  }

  down () {
    this.table('illustrations', (table) => {
      // reverse alternations
      table.dropUnique('user_id', 'user_id_on_illustrations')
    })
  }
}

module.exports = IllustrationBelongToUsersSchema
