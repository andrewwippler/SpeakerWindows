import type { HttpContext } from '@adonisjs/core/http'
import { ChangePasswordValidator } from '#validators/change_password_validator'

export default class PasswordsController {
  public async update({ auth, request, response }: HttpContext) {
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
      return response.status(422).send((error as { messages: unknown }).messages)
    }

    if (!(await user.verifyPassword(payload.currentPassword))) {
      return response.status(400).send({ message: 'Current password is incorrect' })
    }

    user.password = payload.newPassword
    user.mustChangePassword = false
    await user.save()

    return { message: 'Password changed' }
  }
}
