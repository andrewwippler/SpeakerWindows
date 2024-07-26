import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import Illustration from './illustration.js'
import type { BelongsTo } from "@adonisjs/lucid/types/relations";

export default class Upload extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare illustration_id: number

  @column()
  declare name: string

  @column()
  declare type: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Illustration)
  declare illustration: BelongsTo<typeof Illustration>
}
