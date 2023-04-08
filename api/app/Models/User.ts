import { DateTime } from 'luxon'
import Hash from '@ioc:Adonis/Core/Hash'
import { BaseModel, beforeSave, column, hasMany, HasMany, hasOne, HasOne } from '@ioc:Adonis/Lucid/Orm'
import Token from './Token'
import Illustration from './Illustration'
import Tag from './Tag'
import Place from './Place'
import { v4 } from 'uuid'
import Setting from './Setting'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public username: string

  @column()
  public email: string

  @column({ serializeAs: null })
  public tos: boolean

  @column({ serializeAs: null })
  public thirteen: boolean

  @column({ serializeAs: null })
  public password: string

  @column({ serializeAs: null })
  public remember_me_token: string | null

  @column({ serializeAs: null })
  public uid: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @hasMany(() => Place, {
    foreignKey: 'user_id',
  })
  public places: HasMany<typeof Place>

  @hasMany(() => Tag, {
    foreignKey: 'user_id',
  })
  public tags: HasMany<typeof Tag>

  @hasMany(() => Illustration, {
    foreignKey: 'user_id',
  })
  public illustrations: HasMany<typeof Illustration>

  @hasMany(() => Token)
  public tokens: HasMany<typeof Token>

  @hasOne(() => Setting, {
    foreignKey: 'user_id',
  })
  public setting: HasOne<typeof Setting>

  @beforeSave()
  public static async hashPassword (user: User) {
    if (user.$dirty.password) {
      user.password = await Hash.make(user.password)
    }
    if (!user.uid || user.uid == '00000000-0000-0000-0000-000000000000') {
      user.uid = v4()
    }
  }
}
