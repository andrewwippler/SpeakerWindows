import Place from '#models/place'
import Factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'

export default Factory.define(Place, ({ faker }) => {
  return {
    place: faker.company.name(),
    location: faker.location.city() + ', ' + faker.location.state(),
    used: DateTime.fromObject({ ordinal: faker.number.int({ min: 1, max: 360 }) }),
    user_id: faker.number.int({ min: 1, max: 2 }),
  }
}).build()
