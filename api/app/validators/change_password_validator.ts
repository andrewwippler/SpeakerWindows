import vine from '@vinejs/vine'

export const ChangePasswordValidator = vine.compile(
  vine.object({
    currentPassword: vine.string().trim(),
    newPassword: vine
      .string()
      .trim()
      .confirmed()
      .regex(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*].{8,}/),
  })
)
