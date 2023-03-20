import Illustration from 'App/Models/Illustration'
import Factory from '@ioc:Adonis/Lucid/Factory'
import { _ } from 'lodash'

export default Factory.define(Illustration, ({ faker }) => {
  return {
    title: faker.lorem.sentence(),
    author: faker.name.fullName(),
    source: faker.internet.url(),
    content: faker.lorem.paragraph(),
    user_id: faker.datatype.number({ min: 1, max: 2 }),
  }
}).build()
