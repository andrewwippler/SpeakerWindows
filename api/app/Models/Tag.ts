import { DateTime } from 'luxon'
import { BaseModel, beforeSave, column, manyToMany, ManyToMany } from '@ioc:Adonis/Lucid/Orm'
import Illustration from './Illustration'
import { _ } from 'lodash'
import TagSlugSanitizer from 'App/Helpers/Tag'

function fixName(name) {
  let first = _.startCase(name)
  return first.replaceAll(' ', '-')
}

export default class Tag extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public user_id: number

  @column()
  public slug: string

  @column({
    prepare: (value: string) => fixName(value), // uppercase the Title.
  })
  public name: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @manyToMany(() => Illustration, {
    pivotTimestamps: true
  })
  public illustrations: ManyToMany<typeof Illustration>

  @beforeSave()
  public static async createSlug (tag: Tag) {
    if (!tag.slug) {
      tag.slug = tag.name+'-'+tag.user_id
    }
    tag.slug = TagSlugSanitizer(tag.slug)

  }
}
