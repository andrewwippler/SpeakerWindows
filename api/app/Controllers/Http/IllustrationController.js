'use strict'
const Illustration = use('App/Models/Illustration')
const _ = require('lodash')

class IllustrationController {

      /**
   * Displays places associated to an illustration.
   * GET illustrations/:illustration_id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, request, response, view }) {

    const illustration = await Illustration.find(_.get(params, 'id', 0))
    if (!illustration) {
      return response.status(403).send({ message: 'You are not allowed to access this resource' })
    }

    await illustration.loadMany(['places', 'tags'])

    return illustration
  }
}

module.exports = IllustrationController
