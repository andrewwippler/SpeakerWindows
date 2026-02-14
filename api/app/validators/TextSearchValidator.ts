import vine from '@vinejs/vine'

export const TextSearchValidator = vine.compile(
  vine.object({
    query: vine.string().trim().minLength(1).maxLength(500),
    limit: vine.number().range([1, 100]).optional()
  })
)
