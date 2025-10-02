import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { CreateUserValidator } from '#validators/CreateUserValidator'
import Setting from '#models/setting'
import limiter from "@adonisjs/limiter/services/main";

export default class UsersController {

  public async login({ auth, request, response }: HttpContext) {
    const { email, password } = request.all()

    const throttleKey = `login_${email}_${request.ip()}`

    const locallimit = limiter.use({
      requests: 5,
      duration: '5 mins',
      blockDuration: '30 mins',
    })

    if (await locallimit.isBlocked(throttleKey)) {
      return response.tooManyRequests({message: "Too many requests. Please wait 30 minutes and try again."})
    }

    try {

      const user = await User.verifyCredentials(email, password)
      const token = await User.accessTokens.create(user)

      // const user = await User.findByOrFail('email', email)
      const settingsSelect = await user.related('setting').query()
      await locallimit.delete(throttleKey)

      let settings
      if (!settingsSelect[0]) {
        await user.related('setting').save(await new Setting())
        settings = await user.related('setting').query()
      } else {
        settings = settingsSelect
      }

      const sharedToken = token.value!.release()

      return { id: sharedToken, token:sharedToken, settings, name: user.username, email: user.email, uid: user.uid }
    } catch (error) {
      console.log("login error: ", error)
      await locallimit.increment(throttleKey)
    }

    return response.status(401).send({message: "Username or password is incorrect"})


  }

  public show({ auth, params, response }: HttpContext) {
    if (auth.user?.uid !== params.uid) {
      return response.status(401).send({ message: "You cannot see someone else's profile" })
    }
    return auth.user
  }

  public async store({ response, request }: HttpContext) {
    const { email, password, password_confirmation } = request.all()
    try {
      const payload = await CreateUserValidator.validate({ email, password, password_confirmation })
    } catch (error) {
      return response.status(400).send(error.messages)
    }

    const user = await User.create({ email, password })

    return response.send({message: 'Created successfully', uid: user.uid})
  }

}
