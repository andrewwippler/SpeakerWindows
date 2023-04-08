import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Setting from 'App/Models/Setting'

export default class SettingsController {
  public async index({ auth }: HttpContextContract) {
    return await Setting.query().where('user_id', `${auth.user?.id}`)
  }

  public async update({ request, auth }: HttpContextContract) {

    const { place, location } = request.all()

    //we need to find or create
    const settings = await Setting.firstOrCreate({ 'user_id': auth.user?.id })
    settings.place = place
    settings.location = location
    // TODO: need dynamic creation of keys
    settings.save()

    return {
      message: "Settings saved!",
      settings
    }

  }

}
