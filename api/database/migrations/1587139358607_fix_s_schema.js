'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class FixSSchema extends Schema {
  up () {
    this.table('ill_tags', (table) => {
      // alter table
      table.dropColumn('created_at')
      table.dropColumn('updated_at')
    })
  }

  down () {
    this.table('ill_tags', (table) => {
      // alter table
      table.timestamps()
    })
  }
}

module.exports = FixSSchema
