'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

const _ = require('lodash')
const moment = require('moment')

class Place extends Model {

  illustrations () {
    return this.belongsTo('App/Models/Illustration')
  }

  static async createPlace(illustration, place, user_id) {

    // fixes bad timestamps and gives a default value
    place.used = moment(_.get(place, 'used', moment())).format('YYYY-MM-DD HH:mm:ss')

    return await this.create({...place, illustration_id: illustration.id, user_id})
  }

  static get visible () {
    return ['id', 'place', 'location', 'used']
  }

}

module.exports = Place
