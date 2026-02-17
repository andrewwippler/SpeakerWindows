import { schema, rules } from '@adonisjs/validator'
import type { HttpContext } from '@adonisjs/core/http'
import { CustomMessages } from '@adonisjs/validator/types'

export default class CreateContactValidator {
  constructor(protected ctx: HttpContext) {}

  public schema = schema.create({
    email: schema.string({ trim: true }, [rules.email(), rules.required()]),
    reason: schema.string({ trim: true }, [rules.required()]),
    message: schema.string({ trim: true }, [rules.required()]),
  })

  public messages: CustomMessages = {
    'email.required': 'The email field is required',
    'email.email': 'Enter a valid email address',
    'reason.required': 'The reason field is required',
    'message.required': 'The message field is required',
  }
}
