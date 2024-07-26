import Illustration from '#models/illustration'
import Factory from '@adonisjs/lucid/factories'
import { _ } from 'lodash'

export default Factory.define(Illustration, ({ faker }) => {
  return {
    title: faker.lorem.sentence(),
    author: faker.person.fullName(),
    source: faker.internet.url(),
    content: faker.lorem.paragraph(),
    user_id: faker.number.int({ min: 1, max: 2 }),
  }
}).build()
