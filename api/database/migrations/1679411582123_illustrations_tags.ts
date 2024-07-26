import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = 'illustration_tag'

  public async up () {
    this.schema.dropTable('ill_tags')
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('tag_id').unsigned().references('tags.id').onDelete('CASCADE')
      table.integer('illustration_id').unsigned().references('illustrations.id').onDelete('CASCADE')
      table.unique(['tag_id', 'illustration_id'])
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
