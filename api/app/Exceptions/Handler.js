'use strict'

const BaseExceptionHandler = use('BaseExceptionHandler')

/**
 * This class handles all exceptions thrown during
 * the HTTP request lifecycle.
 *
 * @class ExceptionHandler
 */
class ExceptionHandler extends BaseExceptionHandler {
  /**
   * Handle exception thrown during the HTTP lifecycle
   *
   * @method handle
   *
   * @param  {Object} error
   * @param  {Object} options.request
   * @param  {Object} options.response
   *
   * @return {void}
   */
  async handle(error, { request, response }) {

    // console.log('error.name', error.name)
    if (error.name === 'PasswordMisMatchException') {
      return response.status(error.status).send({ message: 'Username or password is incorrect' })
    }
    if (error.name === 'TooManyRequests') {
      return response.status(error.status).send({ message: 'Too many requests. Please wait 30 minutes and try again.' })
    }


    response.status(error.status).send(error.message)
  }

  /**
   * Report exception for logging or debugging.
   *
   * @method report
   *
   * @param  {Object} error
   * @param  {Object} options.request
   *
   * @return {void}
   */
  async report (error, { request }) {
  }
}

module.exports = ExceptionHandler
