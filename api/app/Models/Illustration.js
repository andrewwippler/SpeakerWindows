'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Illustration extends Model {

  //relationships

  places () {
    return this.hasMany('App/Models/Place')
  }

  tags() {
    return this.belongsToMany(
      'App/Models/Tag'
    ).pivotTable('ill_tags')
  }

}

module.exports = Illustration
