import Place from 'App/Models/Place'
import Factory from '@ioc:Adonis/Lucid/Factory'
import { DateTime } from 'luxon'

export default Factory.define(Place, ({ faker }) => {
  return {
    place: faker.company.name(),
    location: faker.address.city() + ', ' + faker.address.state(),
    used: DateTime.fromObject({ ordinal: faker.datatype.number({ min: 1, max: 360 }) }),
    user_id: faker.datatype.number({ min: 1, max: 2 }),
  }
}).build()
