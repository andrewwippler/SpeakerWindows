import type { HttpContext } from '@adonisjs/core/http'
import { ImportHighlightsService } from '#services/import_highlights_service'

export default class ImportsController {
  public async store({ auth, request, response }: HttpContext) {
    try {
      const result = await ImportHighlightsService.run(auth.user!, request)
      return response.ok(result)
    } catch (err: any) {
      return response.badRequest({ message: err.message })
    }
  }
}
