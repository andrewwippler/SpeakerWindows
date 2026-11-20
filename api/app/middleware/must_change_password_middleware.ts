import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class MustChangePasswordMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    if (ctx.auth.user?.mustChangePassword) {
      if (ctx.request.url().startsWith('/api')) {
        return ctx.response.status(403).send({ message: 'Password change required' })
      }

      return ctx.response.redirect('/change-password')
    }

    return next()
  }
}
