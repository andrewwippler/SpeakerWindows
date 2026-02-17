import vine from '@vinejs/vine'

export const CandidatesValidator = vine.compile(
  vine.object({
    query: vine.string().trim().minLength(1).maxLength(500),
    embedding: vine.array(vine.number()).optional(),
  })
)
