'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Place extends Model {

  illustrations () {
    return this.belongsTo('App/Models/Illustration')
  }

  static async createPlace(illustration, place) {

    return await this.create({...place, illustration_id: illustration.id})
  }

  static get visible () {
    return ['place', 'location', 'used']
  }
}

module.exports = Place
