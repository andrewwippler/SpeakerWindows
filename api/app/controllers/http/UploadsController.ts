import { editIllustration } from '#app/abilities/main'
import Illustration from '#models/illustration'
import { cuid } from '@adonisjs/core/helpers'
import { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import env from '#start/env'
import Upload from '#models/upload'
import fs from 'fs/promises'
import _ from 'lodash'

export default class UploadsController {

  public async store({ auth, bouncer, request, response }: HttpContext) {

    const { illustration_id } = request.all()
    const illustration = await Illustration.findOrFail(illustration_id)

    if (await bouncer.denies(editIllustration, illustration)) {
      return response.forbidden({ message: 'E_AUTHORIZATION_FAILURE: Not authorized to perform this action' })
    }
    const sentFile = request.file('illustration_image', {
      size: '20mb',
      extnames: ['jpg', 'png', 'gif', 'pdf']
    })

    if (!sentFile) {
      console.log(sentFile)
      return response.badRequest({ message: "No file uploaded" })
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

  /**
* Delete a upload with id.
* DELETE upload/:id
*
* @param {object} ctx
* @param {Request} ctx.request
* @param {Response} ctx.response
*/
  public async destroy({ params, auth, response }: HttpContext) {

    let id = _.get(params, 'id', 0)
    let upload = await Upload.query()
      .where('id', id)
      .preload('illustration')

    if (upload[0].illustration.user_id != auth.user?.id) {
      return response.status(403).send({ message: 'You do not have permission to access this resource' })
    }
    await upload[0].delete()

    const uploadsPath = app.makePath('uploads', env.get("NODE_ENV"), upload[0].name ) // delete just the attachment
    console.log('deleting:', uploadsPath)
    await fs.rm(uploadsPath, { recursive: false, force: true })
    return response.send({ message: `Deleted Upload id: ${upload[0].id}` })
  }

}
