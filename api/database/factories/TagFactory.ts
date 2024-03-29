import Tag from 'App/Models/Tag'
import Factory from '@ioc:Adonis/Lucid/Factory'

export default Factory.define(Tag, ({ faker }) => {
  return {
    name: faker.lorem.word(),
    user_id: faker.datatype.number({ min: 1, max: 2 }),
  }
}).build()
