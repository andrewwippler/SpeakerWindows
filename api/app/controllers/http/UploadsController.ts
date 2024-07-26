import Upload from '#models/upload'
import { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

export default class UploadsController {

  public async store({ auth, request, response }: HttpContext) {
    const { illustration_id } = request.all()
    // request.multipart('illustration_image', {}, async (file) => {
    //   const imagePath = `${auth.user!.id}/${illustration_id}/${file.clientName}`
    //   // await Drive.disk('s3').put(imagePath, file.stream)

    //   Upload.create({ illustrationId: illustration_id, name: imagePath, type: file.type })

    // })

    // await request.multipart.process()



    const file = request.file('file', {
      size: '2mb',
      extnames: ['jpg', 'png', 'gif', 'pdf']
    })
    if (!file) {
      console.log(file)
      return response.badRequest({message: "No file uploaded"})
    }

    if (!file.isValid) {
      return response.badRequest(file.errors)
    }

    await file.move(app.tmpPath('uploads'))

    return response.ok({ message: 'File uploaded successfully', fileName: file.fileName })
  }
}
