import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, manyToMany, belongsTo } from '@adonisjs/lucid/orm'
import _  from 'lodash'
import Place from './place.js'
import Tag from './tag.js'
import User from './user.js'
import Upload from './upload.js'
import type { ManyToMany, BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { compose } from '@adonisjs/core/helpers'
import { Searchable } from '@foadonis/magnify'

export default class Illustration extends compose(BaseModel, Searchable) {
  @column({ isPrimary: true })
  declare id: number

  @column({
    prepare: (value: string) => _.startCase(value), // uppercase the Title.
  })
  declare title: string

  @column()
  declare author: string | null

  @column()
  declare source: string | null

  @column()
  declare content: string

  @column()
  declare user_id: number

  @column()
  declare legacy_id: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Place, {
    foreignKey: 'illustration_id'
  })
  declare places: HasMany<typeof Place>

  @manyToMany(() => Tag, {
    pivotTimestamps: true
  })
  declare tags: ManyToMany<typeof Tag>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasMany(() => Upload, {
    foreignKey: 'illustration_id',
  })
  declare uploads: HasMany<typeof Upload>

}
