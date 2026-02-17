import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tags'

  public async up() {
    this.schema.table(this.tableName, (table) => {
      table.string('slug').unique()
    })
  }

  public async down() {
    this.schema.table(this.tableName, (t) => {
      t.dropColumn('slug')
    })
  }
}
