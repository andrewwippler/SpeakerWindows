import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Contact from 'App/Models/Contact'
import CreateContactValidator from 'App/Validators/CreateContactValidator'

export default class ContactsController {
  // public async index({}: HttpContextContract) {}

  // public async create({}: HttpContextContract) {}

  public async store({ request, response }: HttpContextContract) {

    try {
      await request.validate(CreateContactValidator)
   } catch (error) {
     return response.status(400).send(error.messages)
   }
   const { email, reason, message } = request.all()

   const contact = await Contact.create({
     email,
     reason,
     message
   })

   return response.send({message: 'Created successfully', id: contact.id})
 }

  // public async show({}: HttpContextContract) {}

  // public async edit({}: HttpContextContract) {}

  // public async update({}: HttpContextContract) {}

  // public async destroy({}: HttpContextContract) {}
}
