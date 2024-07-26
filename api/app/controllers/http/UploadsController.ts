import { editIllustration } from '#app/abilities/main'
import Illustration from '#models/illustration'
import { cuid } from '@adonisjs/core/helpers'
import { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import env from '#start/env'

export default class UploadsController {

  public async store({ auth, bouncer, request, response }: HttpContext) {


    const { illustration_id } = request.all()
    const illustration = await Illustration.findOrFail(illustration_id)

    if (await bouncer.denies(editIllustration, illustration)) {
      return response.forbidden({message: 'E_AUTHORIZATION_FAILURE: Not authorized to perform this action'})
    }
    const sentFile = request.file('illustration_image', {
      size: '20mb',
      extnames: ['jpg', 'png', 'gif', 'pdf']
    })

    if (!sentFile) {
      console.log(sentFile)
      return response.badRequest({message: "No file uploaded"})
    }

    if (!sentFile.isValid) {
      return response.badRequest(sentFile.errors)
    }
    const pathEnv = env.get('NODE_ENV')
    await sentFile.move(app.makePath('uploads', pathEnv), {
      name: `${auth.user!.id}/${illustration_id}/${cuid()}.${sentFile.extname}`
    })

    await illustration.related('uploads').create({
      name: sentFile.fileName!,
      type: sentFile.type
    })

    return response.ok({ message: 'File uploaded successfully', fileName: sentFile.fileName })
  }
}
