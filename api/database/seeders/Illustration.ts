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
      await i.related('tags').attach([
        tags[1].id,
        tags[_.random(0, 20)].id,
        tags[_.random(21, 40)].id,
        tags[_.random(41, 69)].id,
        tags[_.random(61, 80)].id,
        tags[_.random(81, 100)].id,
      ])
      await i.related('places').save(places[_.random(0, 3)])
    })

    _.forEach(illustrationsTwo, async (i) => {
      await i.related('tags').attach([
        tagsTwo[1].id,
        tagsTwo[_.random(0, 20)].id,
        tagsTwo[_.random(21, 40)].id,
        tagsTwo[_.random(41, 69)].id,
        tagsTwo[_.random(61, 80)].id,
        tagsTwo[_.random(81, 100)].id,
      ])
      await i.related('places').save(placesTwo[_.random(0, 3)])
    })

  }
}
