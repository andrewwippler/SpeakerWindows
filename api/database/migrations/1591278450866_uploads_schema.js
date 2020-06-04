'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UploadsSchema extends Schema {
  up () {
    this.create('uploads', (table) => {
      table.increments()
      table.timestamps()
      table.integer('illustration_id')
      table.string('name')
      table.string('type')
    })
  }

  down () {
    this.drop('uploads')
  }
}

module.exports = UploadsSchema
