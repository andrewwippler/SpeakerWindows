import { DateTime } from 'luxon'
import { BaseModel, beforeSave, column, manyToMany } from '@adonisjs/lucid/orm'
import Illustration from './illustration.js'
import _ from 'lodash'
import TagSlugSanitizer from '#app/helpers/tag'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'

function fixName(name) {
  let first = _.startCase(name)
  return first.replaceAll(' ', '-')
}

export default class Tag extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare user_id: number

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
    pivotTimestamps: true
  })
  declare illustrations: ManyToMany<typeof Illustration>

  @beforeSave()
  public static async createSlug (tag: Tag) {
    if (!tag.slug) {
      tag.slug = tag.name+'-'+tag.user_id
    }
    tag.slug = TagSlugSanitizer(tag.slug)

  }
}
