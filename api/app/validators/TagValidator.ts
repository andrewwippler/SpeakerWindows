import vine from '@vinejs/vine'

export const TagValidator = vine
  .compile(
    vine.object({
      name: vine
        .string().trim().unique(
          async (db, value, field) => {
            const user = await db
              .from('tags')
              .where('user_id', field.meta.userId)
              .where('name', value)
              .first()
            return !user

          }
        ),
    })
)