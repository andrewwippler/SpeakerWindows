'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const _ = require('lodash')

class Tag extends Model {

  static boot () {
    super.boot()

    // Uppercase name
    this.addHook('beforeCreate', async (tag) => {
      tag.name = _.startCase(tag.name)
    })
  }

  static get visible () {
    return ['id', 'name']
  }

  illustrations() {
    return this.belongsToMany(
        'App/Models/Illustration'
      ).pivotTable('ill_tags')
  }

}

module.exports = Tag
