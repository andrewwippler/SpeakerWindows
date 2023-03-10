import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {

  public async up () {
    this.schema.table('ill_tags', (table) => {
      table.dropColumn('created_at')
      table.dropColumn('updated_at')
    })

    this.schema.table('illustrations', (table) => {
      table.string('user_id').notNullable().defaultTo(1).index('user_id_on_illustrations')
    })
    this.schema.table('tags', (table) => {
      table.string('user_id').notNullable().defaultTo(1).index('user_id_on_tags')
    })
    this.schema.table('places', (table) => {
      table.string('user_id').notNullable().defaultTo(1).index('user_id_on_places')
    })
  }

  public async down () {
    this.schema.table('ill_tags', (table) => {
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.table('illustrations', (table) => {
      table.dropIndex(['user_id', 'user_id_on_illustrations'])
    })

    this.schema.table('tags', (table) => {
      table.dropIndex(['user_id', 'user_id_on_tags'])
    })

    this.schema.table('places', (table) => {
      table.dropIndex(['user_id', 'user_id_on_places'])
    })
  }
}
