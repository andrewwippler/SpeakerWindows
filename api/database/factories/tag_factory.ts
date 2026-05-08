import Tag from '#models/tag'
import Factory from '@adonisjs/lucid/factories'

export default Factory.define(Tag, ({ faker }) => {
  return {
    name: faker.lorem.word(),
    user_id: faker.number.int({ min: 1, max: 2 }),
    team_id: faker.helpers.maybe(() => faker.number.int({ min: 1, max: 10 })) ?? null,
  }
}).build()
