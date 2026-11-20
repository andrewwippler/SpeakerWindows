import vine from '@vinejs/vine'

export const AddTeamMemberValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email(),
    role: vine.enum(['owner', 'creator', 'editor', 'readonly'] as const),
  })
)
