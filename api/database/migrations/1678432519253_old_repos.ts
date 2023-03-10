import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {


  public async up() {
    // users
    this.schema.createTable('users', (table) => {
      table.increments('id')
      table.string('email', 254).notNullable().unique().index('index_users_on_email')
      table.string('encrypted_password', 255).notNullable()
      table.string('reset_password_token')
      table.datetime('reset_password_sent_at')
      table.datetime('remember_created_at')
      table.integer('sign_in_count').defaultTo(0).notNullable()
      table.datetime('current_sign_in_at')
      table.datetime('last_sign_in_at')
      table.string('current_sign_in_ip')
      table.string('last_sign_in_ip')
      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    //tags
    this.schema.createTable('tags', table => {
      table.increments('id')
      table.string('name').index('tag_name_index')
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    //illustrations
    this.schema.createTable('illustrations', t => {
      t.increments('id')
      t.string('title').index('illustration_titles')
      t.string('author').index('illustration_authors')
      t.string('source')
      t.text('content')
      t.timestamp('created_at', { useTz: true })
      t.timestamp('updated_at', { useTz: true })
    })

    //places
    this.schema.createTable('places', t => {
      t.increments()
      t.integer('illustration_id')
      t.string('place')
      t.string('location')
      t.datetime('used')
      t.timestamp('created_at', { useTz: true })
      t.timestamp('updated_at', { useTz: true })
    })

    //ill_tags
    this.schema.createTable('ill_tags', t => {
      t.integer('illustration_id').unsigned().index('illustration_id')
      t.foreign('illustration_id').references('illustrations.id').onDelete('cascade')
      t.integer('tag_id').unsigned().index('tag_id')
      t.foreign('tag_id').references('tags.id').onDelete('cascade')
      t.timestamp('created_at', { useTz: true })
      t.timestamp('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable('tokens')
    this.schema.dropTable('ill_tags')
    this.schema.dropTable('users')
    this.schema.dropTable('tags')
    this.schema.dropTable('illustrations')
    this.schema.dropTable('places')
  }
}
