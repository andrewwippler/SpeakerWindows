import type { HttpContext } from '@adonisjs/core/http'
import Setting from '#models/setting'
import Illustration from '#models/illustration'

export default class SettingsController {
  public async index({ auth, view }: HttpContext) {
    try {
      let settings = await Setting.query().where('user_id', `${auth.user?.id}`).first()

      let settingsData = settings ? JSON.parse(JSON.stringify(settings)) : {}

      const tag = await Illustration.query()
        .whereHas('tags', (query) => {
          query.where('name', 'To-Fix').orWhere('name', 'Untitled')
        })
        .where('user_id', `${auth.user?.id}`)
      if (tag) {
        const count = tag.length ? tag.length : 0
        settingsData = { ...settingsData, count }
      }

      const tagQuery2 = await Illustration.query()
        .where('user_id', `${auth.user?.id}`)
        .doesntHave('tags')
      const count2 = tagQuery2.length ? tagQuery2.length : 0
      settingsData = { ...settingsData, emptyTags: count2 }

      const illustrationsCount = await Illustration.query()
        .where('user_id', `${auth.user?.id}`)
        .count('* as total')

      return view.render('settings/index', {
        settings: settingsData,
        illustrationsCount: Number(illustrationsCount[0].$extras.total),
      })
    } catch (error) {
      console.error('Settings error:', error)
      return view.render('settings/index', { settings: {}, illustrationsCount: 0 })
    }
  }

  public async update({ request, auth, response, session }: HttpContext) {
    const { place, location } = request.all()

    try {
      const settings = await Setting.firstOrCreate({ user_id: auth.user?.id })
      settings.place = place
      settings.location = location
      await settings.save()

      session.flash('success', 'Settings saved!')
    } catch (error) {
      console.error('Settings update error:', error)
      session.flash('error', 'Failed to save settings')
    }

    return response.redirect('back')
  }
}
