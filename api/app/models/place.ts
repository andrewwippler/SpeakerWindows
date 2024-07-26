import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import Illustration from './illustration.js'
import User from './user.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Place extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare illustration_id: number

  @column()
  declare user_id: number

  @column()
  declare place: string

  @column()
  declare location: string

  @column.date()
  declare used: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Illustration, {
    foreignKey: 'illustration_id',
  })
  declare illustration: BelongsTo<typeof Illustration>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
