import type { HttpContext } from '@adonisjs/core/http'
import Setting from '#models/setting'

export default class SettingsController {
  public async index({ auth }: HttpContext) {
    return await Setting.query().where('user_id', `${auth.user?.id}`)
  }

  public async update({ request, auth }: HttpContext) {

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
