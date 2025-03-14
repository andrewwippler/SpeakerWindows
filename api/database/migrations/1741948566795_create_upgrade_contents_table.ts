import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'illustrations'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // https://www.atlassian.com/data/databases/understanding-strorage-sizes-for-mysql-text-data-types
      table.text('content', 'mediumtext').alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text('content').alter()
    })

  }
}