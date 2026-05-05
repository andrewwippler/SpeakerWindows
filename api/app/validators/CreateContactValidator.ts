import vine from '@vinejs/vine'

export const CreateContactValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email(),
    reason: vine.string().trim(),
    message: vine.string().trim(),
  })
)
