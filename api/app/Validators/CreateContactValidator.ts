import { schema, CustomMessages, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class CreateContactValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    email: schema.string({ trim: true },[
      rules.email(),
      rules.required(),
    ]),
    reason: schema.string({ trim: true }, [
      rules.required(),
    ]),
    message: schema.string({ trim: true }, [
      rules.required(),
    ]),
  })

  public messages: CustomMessages = {
    'email.required': 'The email field is required',
    'email.email': 'Enter a valid email address',
    'reason.required': 'The reason field is required',
    'message.required': 'The message field is required',
  }
}
