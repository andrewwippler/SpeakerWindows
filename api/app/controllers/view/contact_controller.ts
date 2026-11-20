import type { HttpContext } from '@adonisjs/core/http'

export default class ContactController {
  public async index({ view }: HttpContext) {
    return view.render('contact/index')
  }

  public async store({ session, response }: HttpContext) {
    // TODO: Send email in production
    session.flash('success', 'Message sent! We will get back to you soon.')
    return response.redirect('/contact')
  }
}
