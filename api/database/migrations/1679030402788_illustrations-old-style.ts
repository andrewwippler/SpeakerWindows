import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'illustrations'

  public async up () {
    this.schema.table(this.tableName, (table) => {
      table.integer('legacy_id').defaultTo(0).notNullable()
    })
  }

  public async down() {
    this.schema.table(this.tableName, (table) => {
      table.dropColumn('legacy_id')
    })
  }
}