import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, belongsTo } from '@adonisjs/lucid/orm'
import type { HasMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import TeamMember from './team_member.js'
import Illustration from './illustration.js'

export type TeamRole = 'owner' | 'creator' | 'editor' | 'readonly'

export default class Team extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare inviteCode: string

  @column()
  declare name: string

  @column()
  declare userId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare owner: BelongsTo<typeof User>

  @hasMany(() => TeamMember)
  declare members: HasMany<typeof TeamMember>

  @hasMany(() => Illustration)
  declare illustrations: HasMany<typeof Illustration>
}
