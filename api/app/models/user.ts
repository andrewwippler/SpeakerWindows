import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { BaseModel, beforeSave, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import { compose } from '@adonisjs/core/helpers'
import Token from './token.js'
import Illustration from './illustration.js'
import Tag from './tag.js'
import Place from './place.js'
import { v4 } from 'uuid'
import Setting from './setting.js'
import type { HasMany, HasOne } from "@adonisjs/lucid/types/relations"
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'


const AuthFinder = withAuthFinder(() => hash.use('bcrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare username: string

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare tos: boolean

  @column({ serializeAs: null })
  declare thirteen: boolean

  @column({ serializeAs: null })
  declare password: string

  @column({ serializeAs: null })
  declare remember_me_token: string | null

  @column({ serializeAs: null })
  declare uid: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Place, {
    foreignKey: 'user_id',
  })
  declare places: HasMany<typeof Place>

  @hasMany(() => Tag, {
    foreignKey: 'user_id',
  })
  declare tags: HasMany<typeof Tag>

  @hasMany(() => Illustration, {
    foreignKey: 'user_id',
  })
  declare illustrations: HasMany<typeof Illustration>

  @hasMany(() => Token)
  declare tokens: HasMany<typeof Token>

  @hasOne(() => Setting, {
    foreignKey: 'user_id',
  })
  declare setting: HasOne<typeof Setting>

  @beforeSave()
  public static async UidGen (user: User) {
    if (!user.uid || user.uid == '00000000-0000-0000-0000-000000000000') {
      user.uid = v4()
    }
  }

  static accessTokens = DbAccessTokensProvider.forModel(User, {
    expiresIn: '30 days',
    prefix: 'oat_',
    table: 'api_tokens',
    type: 'auth_token',
    tokenSecretLength: 40,
  })
}
