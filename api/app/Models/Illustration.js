'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const _ = require('lodash')

class Illustration extends Model {
  static boot () {
    super.boot()

    // Uppercase name
    this.addHook('beforeCreate', async (i) => {
      i.title = _.startCase(i.title)
    })
  }

  //relationships

  places () {
    return this.hasMany('App/Models/Place')
  }

  tags() {
    return this.belongsToMany(
      'App/Models/Tag'
    ).pivotTable('ill_tags')
  }

  users() {
    return this.belongsTo('App/Models/User')
  }

  uploads() {
    return this.hasMany('App/Models/Upload')
  }

  static get hidden () {
    return ['user_id']
  }

}

module.exports = Illustration
