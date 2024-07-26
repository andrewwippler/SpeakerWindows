//@ts-nocheck

import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Illustration from '#models/illustration'
import User from '#models/user'
import Tag from '#models/tag'
import IllustrationFactory from '#database/factories/IllustrationFactory'
import PlaceFactory from '#database/factories/PlaceFactory'
import TagFactory from '#database/factories/TagFactory'
import _ from 'lodash'

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
