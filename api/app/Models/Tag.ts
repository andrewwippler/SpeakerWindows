import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany, ManyToMany } from '@ioc:Adonis/Lucid/Orm'
import Illustration from './Illustration'
import { _ } from 'lodash'

export default class Tag extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public user_id: number

  @column({
    prepare: (value: string) => _.startCase(value), // uppercase the Title.
  })
  public name: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @manyToMany(() => Illustration,{
    pivotTable: 'ill_tags',
  })
  public illustrations: ManyToMany<typeof Illustration>
}