import app from '@adonisjs/core/services/app'
import { type HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import { errors as shieldErrors } from '@adonisjs/shield'
import { errors as authErrors } from '@adonisjs/auth'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction

  async handle(error: unknown, ctx: HttpContext) {
if (error instanceof authErrors.E_UNAUTHORIZED_ACCESS) {
      const pathname = ctx.request.parsedUrl.pathname

      // Avoid looping if request is already targeting auth pages or API
      if (pathname === '/login' || pathname === '/register' || pathname.startsWith('/api')) {
        return super.handle(error, ctx)
      }

      return ctx.response.redirect().toPath('/login')
    }

    if (error instanceof shieldErrors.E_BAD_CSRF_TOKEN) {
      ctx.logger.error({
        msg: 'CSRF Token Validation Failed',
        url: ctx.request.url(true),
        method: ctx.request.method(),
      })
    }

    return super.handle(error, ctx)
  }

  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}