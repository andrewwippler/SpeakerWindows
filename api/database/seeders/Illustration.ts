//@ts-nocheck

import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import User from 'App/Models/User'
import IllustrationFactory from 'Database/factories/IllustrationFactory'
import PlaceFactory from 'Database/factories/PlaceFactory'
import TagFactory from 'Database/factories/TagFactory'
import { _ } from 'lodash'

export default class extends BaseSeeder {
  public async run () {
    const user1 = User.create({ email: 'test@test.com', password: 'Test1234' })
    const user2 = User.create({ email: 'test5@test.com', password: 'Test12345' })

    const illustrations = await IllustrationFactory.merge({ user_id: user1.id }).createMany(50)
    const illustrationsTwo = await IllustrationFactory.merge({user_id: user2.id }).createMany(50)
    const places = await PlaceFactory.merge({ user_id: user1.id }).makeMany(3)
    const tags = await TagFactory.merge({ user_id: user1.id }).createMany(100)
    const placesTwo = await PlaceFactory.merge({ user_id: user2.id }).makeMany(3)
    const tagsTwo = await TagFactory.merge({ user_id: user2.id }).createMany(100)


    _.forEach(illustrations, async (i) => {

      let idOne = _.random(0, 20)
      let idTwo = _.random(21, 40)
      let idThree = _.random(41, 69)
      let idFour = _.random(61, 80)
      let idFive = _.random(81, 99)
      await i.related('tags').attach([
        tags[1].id,
        tags[idOne].id,
        tags[idTwo].id,
        tags[idThree].id,
        tags[idFour].id,
        tags[idFive].id
      ])
      await i.related('places').save(places[_.random(0, 3)])
    })

    _.forEach(illustrationsTwo, async (i) => {

      let idOne = _.random(0, 20)
      let idTwo = _.random(21, 40)
      let idThree = _.random(41, 69)
      let idFour = _.random(61, 80)
      let idFive = _.random(81, 99)
      await i.related('tags').attach([
        tagsTwo[1].id,
        tagsTwo[idOne].id,
        tagsTwo[idTwo].id,
        tagsTwo[idThree].id,
        tagsTwo[idFour].id,
        tagsTwo[idFive].id
      ])
      await i.related('places').save(placesTwo[_.random(0, 3)])
    })

  }
}
