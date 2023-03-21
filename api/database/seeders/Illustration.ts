//@ts-nocheck

import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Illustration from 'App/Models/Illustration'
import User from 'App/Models/User'
import Tag from 'App/Models/Tag'
import IllustrationFactory from 'Database/factories/IllustrationFactory'
import PlaceFactory from 'Database/factories/PlaceFactory'
import TagFactory from 'Database/factories/TagFactory'
import { _ } from 'lodash'

export default class extends BaseSeeder {
  public async run() {


    const user1 = await User.find(1)
    const user2 = await User.find(2)

    const illus1 = await IllustrationFactory.merge({ user_id: user1.id }).create()
    const illus2 = await IllustrationFactory.merge({ user_id: user2.id }).create()

    const allTags1 = [1,2,3,4,5,6,7,8,9,10]
    const allTags2 = [11,12,13,14,15,16,17,18,19,20]
    const ill1 = await Illustration.find(illus1.id)
    await ill1.related('tags').attach(allTags1)
    const ill2 = await Illustration.find(illus2.id)
    await ill2.related('tags').attach(allTags2)

  }
}
