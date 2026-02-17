import type { HttpContext } from '@adonisjs/core/http'
import Setting from '#models/setting'
import Illustration from '#models/illustration'

export default class SettingsController {
  public async index({ auth }: HttpContext) {
    var settings = await Setting.query().where('user_id', `${auth.user?.id}`).first()
    if (!settings) {
      return {
        message: 'no results found',
      }
    }
    var newSettings = JSON.parse(JSON.stringify(settings))

    // get count of illustrations in the To-Fix tag
    const tag = await Illustration.query()
      .whereHas('tags', (query) => {
        query.where('name', 'To-Fix').orWhere('name', 'Untitled')
      })
      .where('user_id', `${auth.user?.id}`)
    if (tag) {
      const count = tag.length ? tag.length : 0

      // clone settings to avoid mutating the original
      // add the count to the settings object

      newSettings = { ...newSettings, count }
    }

    // illustrations do not have tags
    const tagQuery2 = await Illustration.query()
      .where('user_id', `${auth.user?.id}`)
      .doesntHave('tags')
    const count2 = tagQuery2.length ? tagQuery2.length : 0
    console.log({ message: 'settings', user_id: `${auth.user?.id}`, data: tagQuery2 })
    newSettings = { ...newSettings, emptyTags: count2 }
    console.log({ message: 'settings', user_id: `${auth.user?.id}`, data: newSettings })

    console.log({ message: 'New', user_id: `${auth.user?.id}`, data: newSettings })
    return newSettings
  }

  public async update({ request, auth }: HttpContext) {
    const { place, location } = request.all()

    //we need to find or create
    const settings = await Setting.firstOrCreate({ user_id: auth.user?.id })
    settings.place = place
    settings.location = location
    // TODO: need dynamic creation of keys
    settings.save()

    return {
      message: 'Settings saved!',
      settings,
    }
  }
}
