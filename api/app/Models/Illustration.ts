import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, HasMany, manyToMany, ManyToMany, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import { _ } from 'lodash'
import Place from './Place'
import Tag from './Tag'
import User from './User.ts'
import Upload from './Upload'

export default class Illustration extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({
    prepare: (value: string) => _.startCase(value), // uppercase the Title.
  })
  public title: string

  @column()
  public author: string | null

  @column()
  public source: string | null

  @column()
  public content: string

  @column()
  public user_id: number

  @column()
  public legacy_id: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @hasMany(() => Place, {
    foreignKey: 'illustration_id'
  })
  public places: HasMany<typeof Place>

  @manyToMany(() => Tag,{
    pivotTable: 'ill_tags',
  })
  public tags: ManyToMany<typeof Tag>

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @hasMany(() => Upload, {
    foreignKey: 'illustration_id',
  })
  public uploads: HasMany<typeof Upload>

}
