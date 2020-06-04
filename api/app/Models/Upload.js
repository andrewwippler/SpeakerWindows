'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Upload extends Model {

  illustrations () {
    return this.belongsTo('App/Models/Illustration')
  }

}

module.exports = Upload
