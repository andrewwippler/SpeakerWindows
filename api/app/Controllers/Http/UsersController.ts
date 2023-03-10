import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import CreateUserValidator from 'App/Validators/CreateUserValidator'
import { Limiter } from '@adonisjs/limiter/build/services/index'

export default class UsersController {

  public async login({ auth, request, response }: HttpContextContract) {
    const { email, password } = request.all()

    const throttleKey = `login_${email}_${request.ip()}`

    const limiter = Limiter.use({
      requests: 5,
      duration: '5 mins',
      blockDuration: '30 mins',
    })

    if (await limiter.isBlocked(throttleKey)) {
      return response.tooManyRequests({message: "Too many requests. Please wait 30 minutes and try again."})
    }

    try {
      const token = await auth.use('api').attempt(email, password)
      await limiter.delete(throttleKey)
      const user = await User.findBy('email', email)
      // console.log("USER D",user.id)
      return token
    } catch (error) {
      await limiter.increment(throttleKey)
    }

    return response.status(401).send({message: "Username or password is incorrect"})


  }

  public show({ auth, params }: HttpContextContract) {
    if (auth.user.uid !== params.uid) {
      return "You cannot see someone else's profile"
    }
    return auth.user
  }

  public async store({ response, request }: HttpContextContract) {
    try {
       const payload = await request.validate(CreateUserValidator)
    } catch (error) {
      return response.status(400).send(error.messages)
    }
    const { email, password } = request.all()

    const user = await User.create({
      email,
      password
    })

    return response.send({message: 'Created successfully', uid: user.uid})
  }

}
