import vine from '@vinejs/vine'

export const HybridSearchValidator = vine.compile(
  vine.object({
    query: vine.string().trim().minLength(1).maxLength(500),
    embedding: vine.array(vine.number()).optional(),
    limit: vine.number().range([1, 100]).optional(),
    includeDetails: vine.boolean().optional()
  })
)
