import type { HttpContext } from '@adonisjs/core/http'
import { ChangePasswordValidator } from '#validators/change_password_validator'

export default class PasswordViewController {
  public async show({ view }: HttpContext) {
    return view.render('auth/change_password')
  }

  public async update({ auth, request, response, session, view }: HttpContext) {
    const user = auth.user!
    const { currentPassword, newPassword } = request.all()

    let payload
    try {
      payload = await ChangePasswordValidator.validate({
        currentPassword,
        newPassword,
        newPassword_confirmation: request.input('newPassword_confirmation'),
      })
    } catch (error) {
      session.flash('errors', (error as { messages: unknown }).messages as any)
      session.flash('error', 'Please check the password fields and try again')
      return view.render('auth/change_password')
    }

    if (!(await user.verifyPassword(payload.currentPassword))) {
      session.flash('error', 'Current password is incorrect')
      return view.render('auth/change_password')
    }

    user.password = payload.newPassword
    user.mustChangePassword = false
    await user.save()

    session.flash('success', 'Password changed')
    return response.redirect('/')
  }
}
