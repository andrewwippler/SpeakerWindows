import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import CreateUserValidator from 'App/Validators/CreateUserValidator'
import { Limiter } from '@adonisjs/limiter/build/services/index'
import Setting from 'App/Models/Setting'

export default class UsersController {

  public async login({ auth, request, response }: HttpContextContract) {
    const { email, password } = request.all()
    // console.log(email,password)

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
      const user = await User.findByOrFail('email', email)
      const settingsSelect = await user.related('setting').query()
      await limiter.delete(throttleKey)

      let settings
      if (!settingsSelect[0]) {
        await user.related('setting').save(await new Setting())
        settings = await user.related('setting').query()
      } else {
        settings = settingsSelect
      }

      return { token: token.token, settings }
    } catch (error) {
      // console.log("login error: ", error)
      await limiter.increment(throttleKey)
    }

    return response.status(401).send({message: "Username or password is incorrect"})


  }

  public show({ auth, params }: HttpContextContract) {
    if (auth.user?.uid !== params.uid) {
      return "You cannot see someone else's profile"
    }
    return auth.user
  }

  public async store({ response, request }: HttpContextContract) {
    try {
       await request.validate(CreateUserValidator)
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
