import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'illustrations'

  public async up () {
    this.schema.raw(`
      ALTER TABLE illustrations ADD COLUMN content_tsv tsvector;
    `)

    this.schema.raw(`
      CREATE INDEX illustrations_content_tsv_idx
      ON illustrations
      USING gin(content_tsv);
    `)

    this.schema.raw(`
      CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
      ON illustrations FOR EACH ROW EXECUTE FUNCTION
      tsvector_update_trigger(content_tsv, 'pg_catalog.english', content);
    `)
  }

  public async down () {
    this.schema.raw(`DROP TRIGGER tsvectorupdate ON illustrations;`)
    this.schema.raw(`DROP INDEX illustrations_content_tsv_idx;`)
    this.schema.raw(`ALTER TABLE illustrations DROP COLUMN content_tsv;`)
  }
}