import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Application from '@ioc:Adonis/Core/Application'

export default class UploadsController {

  public async store({ request, response }: HttpContextContract) {
    // const { illustration_id } = request.all()
    // request.multipart.file('illustration_image', {}, async (file) => {
    //   const imagePath = `${auth.user.uid}/${illustration_id}/${file.clientName}`
    //   await Drive.disk('s3').put(imagePath, file.stream)

    //   Upload.create({ illustration_id, name: imagePath, type: file.type })

    // })

    // await request.multipart.process()



    const file = request.file('file', {
      size: '2mb',
      extnames: ['jpg', 'png', 'gif', 'pdf']
    })

    if (!file) {
      return response.badRequest('No file uploaded')
    }

    if (!file.isValid) {
      return response.badRequest(file.errors)
    }

    await file.move(Application.tmpPath('uploads'))

    return response.ok({ message: 'File uploaded successfully', fileName: file.fileName })
  }
}
