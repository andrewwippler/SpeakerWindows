import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tags'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('team_id').nullable()
    })

    await this.db.raw(`
      ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_slug_unique
    `)

    await this.db.raw(`
      CREATE UNIQUE INDEX tags_user_team_slug_unique ON tags (user_id, COALESCE(team_id, 0), slug)
    `)
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('team_id')
    })

    await this.db.raw(`
      DROP INDEX IF EXISTS tags_user_team_slug_unique
    `)

    await this.db.raw(`
      ALTER TABLE tags ADD CONSTRAINT tags_slug_unique UNIQUE (slug)
    `)
  }
}
