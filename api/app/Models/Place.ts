import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import Illustration from './Illustration'
import User from './User'

export default class Place extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public illustration_id: number

  @column()
  public user_id: number

  @column()
  public place: string

  @column()
  public location: string

  @column.date()
  public used: DateTime

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Illustration)
  public illustrations: BelongsTo<typeof Illustration>

  @belongsTo(() => User)
  public users: BelongsTo<typeof User>
}
