import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Team from './team.js'
import type { TeamRole } from './team.js'

export type InvitationStatus = 'pending' | 'accepted' | 'declined'

export default class TeamInvitation extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare teamId: number

  @column()
  declare userId: number

  @column()
  declare role: TeamRole

  @column()
  declare status: InvitationStatus

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => Team, {
    foreignKey: 'teamId',
  })
  declare team: BelongsTo<typeof Team>

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>
}
