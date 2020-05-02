'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

/** @type {import('@adonisjs/framework/src/Hash')} */
const Hash = use('Hash')
const { uuid, empty } = require('uuidv4')
const _ = require('lodash')

class User extends Model {

  static boot () {
    super.boot()

    this.addHook('beforeSave', async (userInstance) => {
      /**
       * A hook to hash the user password before saving
       * it to the database.
       */
      if (userInstance.dirty.password) {
        userInstance.password = await Hash.make(userInstance.password)
        _.unset(userInstance, 'password_confirmation')
      }

      // fix migrated users
      if (!userInstance.uid || userInstance.uid == empty()) {
        userInstance.uid = uuid()
      }
    })
  }

  /**
   * A relationship on tokens is required for auth to
   * work. Since features like `refreshTokens` or
   * `rememberToken` will be saved inside the
   * tokens table.
   *
   * @method tokens
   *
   * @return {Object}
   */
  tokens () {
    return this.hasMany('App/Models/Token')
  }

  static get hidden () {
    return ['id', 'password', 'created_at', 'updated_at']
  }
}

module.exports = User
