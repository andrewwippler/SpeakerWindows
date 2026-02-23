// src/validators/illustration_bulk_validator.ts
import { validator, rules } from '@adonisjs/validator'

export const bulkIllustrationValidator = validator.compile({
  illustrations: rules.array([
    rules.integer(),
    rules.exists({ table: 'illustrations', column: 'id' }),
  ]),
  action: rules.enum(['toggle_privacy', 'remove_tag']),
  data: rules.custom('data must be a boolean or string depending on the action'),
})
