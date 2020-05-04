'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class IllustrationBelongToUsersSchema extends Schema {
  up () {
    this.table('illustrations', (table) => {
      // alter table
      table.string('user_id').notNull().default(1).index('user_id_on_illustrations')
    })
    this.table('tags', (table) => {
      // alter table
      table.string('user_id').notNull().default(1).index('user_id_on_tags')
    })
    this.table('places', (table) => {
      // alter table
      table.string('user_id').notNull().default(1).index('user_id_on_places')
    })
  }

  down () {
    this.table('illustrations', (table) => {
      // reverse alternations
      table.dropUnique('user_id', 'user_id_on_illustrations')
    })

    this.table('tags', (table) => {
      // reverse alternations
      table.dropUnique('user_id', 'user_id_on_tags')
    })

    this.table('places', (table) => {
      // reverse alternations
      table.dropUnique('user_id', 'user_id_on_places')
    })
  }
}

module.exports = IllustrationBelongToUsersSchema
