'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
const Place = use('App/Models/Place')

class PlaceController {
    /**
   * Displays places associated to an illustration.
   * GET places/:illustration_id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, request, response, view }) {
    return Place.query().where({illustration_id: params.illustration_id}).fetch()
  }
}

module.exports = PlaceController