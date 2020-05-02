'use strict'
const { rule } = use('Validator')
class User {
  get rules () {
    return {
      email: 'required|email|unique:users',
      password: [
        rule('regex', /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{8,}/),
        rule('required'),
        rule('confirmed')
      ]
    }
  }

  get messages () {
    return {
      'email.required': 'The email field is required',
      'email.email': 'Enter a valid email address',
      'email.unique': 'Email already exists',
      'password.required': 'The password field is required',
      'password.regex': 'The password field must be at least 8 characters with one of the following: a number, uppercase character, and lowercase character.',
      'password.confirmed': 'The password fields do not match',
    }
  }

  async fails (errorMessages) {
    return this.ctx.response.status(400).send(errorMessages)
  }
}

module.exports = User
