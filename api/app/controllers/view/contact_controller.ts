import type { HttpContext } from '@adonisjs/core/http'

export default class ContactController {
  public async index({ view }: HttpContext) {
    return view.render('contact/index')
  }

  public async store({ request, session, response }: HttpContext) {
    const { name, email, subject, message } = request.all()
    // TODO: Send email in production
    session.flash('success', 'Message sent! We will get back to you soon.')
    return response.redirect('/contact')
  }
}
