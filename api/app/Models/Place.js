'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Place extends Model {

  illustrations () {
    return this.belongsTo('App/Models/Illustration')
  }
}

module.exports = Place
