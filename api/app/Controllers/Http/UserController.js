'use strict'

const User = use('App/Models/User')

class UserController {

  async login ({ auth, request }) {
    const { email, password } = request.all()
    const user = await auth.attempt(email, password)

    return user

  }

  show({ auth, params }) {
    if (auth.user.uid !== params.uid) {
      return "You cannot see someone else's profile"
    }
    return auth.user
  }

  async store({ response, auth, request }) {

    const { email, password } = request.post()

    const user = await User.create({
      email,
      password
    })

    return response.send({message: 'Created successfully', uid: user.uid})
  }

}

module.exports = UserController
