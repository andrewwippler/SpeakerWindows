import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Tag from '#models/tag'
import Team from '#models/team'
import TeamMember from '#models/team_member'
import IllustrationFactory from '#database/factories/IllustrationFactory'
import PlaceFactory from '#database/factories/PlaceFactory'
import _ from 'lodash'

function getTags(userId: number) {
  if (userId === 1) {
    return [
      { name: 'Abomasum', user_id: userId },
      { name: 'Absquatulate', user_id: userId },
      { name: 'Adagio', user_id: userId },
      { name: 'Alfresco', user_id: userId },
      { name: 'Alcazar', user_id: userId },
      { name: 'Amok', user_id: userId },
      { name: 'Amphisbaena', user_id: userId },
      { name: 'Antimacassar', user_id: userId },
      { name: 'Atingle', user_id: userId },
      { name: 'Bailiwick', user_id: userId },
    ]
  }
  if (userId === 2) {
    return [
      { name: 'Bafflegab', user_id: userId },
      { name: 'Ballistic', user_id: userId },
      { name: 'Bamboozle', user_id: userId },
      { name: 'Bedlam', user_id: userId },
      { name: 'Bugbear', user_id: userId },
      { name: 'Bulbous', user_id: userId },
      { name: 'Calamity', user_id: userId },
      { name: 'Calliope', user_id: userId },
      { name: 'Catamaran', user_id: userId },
      { name: 'Convivial', user_id: userId },
    ]
  }
  return [
    { name: 'Cornucopia', user_id: userId },
    { name: 'Dazzle', user_id: userId },
    { name: 'Ebullient', user_id: userId },
    { name: 'Effervescent', user_id: userId },
    { name: 'Flabbergasted', user_id: userId },
    { name: 'Gargantuan', user_id: userId },
    { name: 'Hullabaloo', user_id: userId },
    { name: 'Jubilation', user_id: userId },
    { name: 'Kaleidoscope', user_id: userId },
    { name: 'Luminous', user_id: userId },
  ]
}

export default class IndexSeeder extends BaseSeeder {
  public async run() {
    await User.updateOrCreateMany('email', [
      { email: 'test@test.com', password: 'Test1234' },
      { email: 'test2@test.com', password: 'Test12345' },
      { email: 'test3@test.com', password: 'Test123456' },
    ])

    const tags1 = await Tag.fetchOrCreateMany('name', getTags(1))
    const tags2 = await Tag.fetchOrCreateMany('name', getTags(2))
    const tags3 = await Tag.fetchOrCreateMany('name', getTags(3))

    const user1 = await User.find(1)
    const user2 = await User.find(2)
    const user3 = await User.find(3)

    if (!user1 || !user2 || !user3) {
      throw new Error('Users not found')
    }

    const team = await Team.create({
      inviteCode: 'TEAM' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      name: 'Test Team',
      userId: user2.id,
    })

    await TeamMember.create({
      teamId: team.id,
      userId: user2.id,
      role: 'owner',
    })

    await TeamMember.create({
      teamId: team.id,
      userId: user3.id,
      role: 'editor',
    })

    const users = [
      { user: user1, tags: tags1, teamId: null },
      { user: user2, tags: tags2, teamId: team.id },
      { user: user3, tags: tags3, teamId: team.id },
    ]

    for (const { user, tags, teamId } of users) {
      for (let i = 0; i < 20; i++) {
        const illustration = await IllustrationFactory.merge({
          user_id: user.id,
          team_id: teamId,
        }).create()

        const randomTags = _.sampleSize(tags, 5)
        const tagIds = randomTags.map((t) => t.id)
        await illustration.related('tags').attach(tagIds)

        const place = await PlaceFactory.merge({
          illustration_id: illustration.id,
          user_id: user.id,
        }).create()

        await illustration.related('places').save(place)
      }
    }
  }
}
