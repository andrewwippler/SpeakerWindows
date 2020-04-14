'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Tag extends Model {

  illustrations() {
    return this.belongsToMany(
        'App/Models/Illustration'
      ).pivotTable('ill_tags')
  }
}

module.exports = Tag
