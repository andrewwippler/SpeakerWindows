'use strict'

const Schema = use('Schema')

class UserSchema extends Schema {
  async up() {
    const exists = await this.hasTable('users')

    if (!!exists) {
      this.createIfNotExists('users', table => {
        // existing
        table.dropUnique('email', 'index_users_on_email')
        table.increments('id')
        table.string('email', 254).notNullable().unique().index('index_users_on_email')
        table.string('encrypted_password', 60).notNullable()
        table.string('reset_password_token')
        table.datetime('reset_password_sent_at')
        table.datetime('remember_created_at')
        table.integer('sign_in_count').defaultTo(0).notNullable()
        table.datetime('current_sign_in_at')
        table.datetime('last_sign_in_at')
        table.string('current_sign_in_ip')
        table.string('last_sign_in_ip')
        table.timestamps()
      })
      this.createIfNotExists('tokens', table => {
        table.increments()
        table.bigInteger('user_id', 20).references('id').inTable('users')
        table.string('token', 255).notNullable().unique()
        table.string('type', 80).notNullable()
        table.boolean('is_revoked').defaultTo(false)
        table.timestamps()
      })
    } else {
      // new
      this.create('users', table => {
        table.increments('id')
        table.string('email', 254).notNullable().unique().index('index_users_on_email')
        table.string('encrypted_password', 60).notNullable()
        table.string('reset_password_token')
        table.datetime('reset_password_sent_at')
        table.datetime('remember_created_at')
        table.integer('sign_in_count').defaultTo(0).notNullable()
        table.datetime('current_sign_in_at')
        table.datetime('last_sign_in_at')
        table.string('current_sign_in_ip')
        table.string('last_sign_in_ip')
        table.timestamps()
      })
      this.createIfNotExists('tokens', table => {
        table.increments()
        table.integer('user_id').unsigned().references('id').inTable('users')
        table.string('token', 255).notNullable().unique()
        table.string('type', 80).notNullable()
        table.boolean('is_revoked').defaultTo(false)
        table.timestamps()
      })
    }

    this.createIfNotExists('tags', table => {
      table.increments('id')
      table.string('name').index('tag_name_index')
      table.timestamps()
    })
    this.createIfNotExists('illustrations', t => {
      t.increments('id')
      t.string('title').index('illustration_titles')
      t.string('author').index('illustration_authors')
      t.string('source')
      t.text('content')
      t.timestamps()
    })
    this.createIfNotExists('places', t => {
      t.increments()
      t.integer('illustration_id')
      t.string('place')
      t.string('location')
      t.datetime('used')
      t.timestamps()
    })
    this.createIfNotExists('ill_tags', t => {
      t.integer('illustration_id').unsigned().index('illustration_id')
      t.foreign('illustration_id').references('illustrations.id').onDelete('cascade')
      t.integer('tag_id').unsigned().index('tag_id')
      t.foreign('tag_id').references('tags.id').onDelete('cascade')
      t.timestamps()
    })
  }

  down () {
    this.drop('tokens')
    this.drop('ill_tags')
    this.drop('users')
    this.drop('tags')
    this.drop('illustrations')
    this.drop('places')
  }
}

module.exports = UserSchema
