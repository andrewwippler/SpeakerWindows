import vine from '@vinejs/vine'

export const CreateContactValidator = vine.create(
  vine.object({
    email: vine.string().trim().email(),
    reason: vine.string().trim(),
    message: vine.string().trim(),
  })
)
