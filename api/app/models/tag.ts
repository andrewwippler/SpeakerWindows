import { DateTime } from 'luxon'
import { BaseModel, beforeSave, column, manyToMany, belongsTo } from '@adonisjs/lucid/orm'
import Illustration from './illustration.js'
import Team from './team.js'
import _ from 'lodash'
import TagSlugSanitizer from '#app/helpers/tag'
import type { ManyToMany, BelongsTo } from '@adonisjs/lucid/types/relations'

function fixName(name: string | undefined) {
  let first = _.startCase(name)
  return first.replaceAll(' ', '-')
}

export default class Tag extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare user_id: number

  @column({ default: null })
  declare team_id: number | null

  @column()
  declare slug: string

  @column({
    prepare: (value: string) => fixName(value), // uppercase the Title.
  })
  declare name: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @manyToMany(() => Illustration, {
    pivotTimestamps: true,
  })
  declare illustrations: ManyToMany<typeof Illustration>

  @belongsTo(() => Team)
  declare team: BelongsTo<typeof Team>

  @beforeSave()
  public static async createSlug(tag: Tag) {
    if (!tag.slug) {
      const teamPart = tag.team_id ? `-team-${tag.team_id}` : ''
      tag.slug = (tag.name || 'default-name') + '-' + (tag.user_id || '0') + teamPart
    }
    tag.slug = TagSlugSanitizer(tag.slug)
  }
}
