import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Tag from '#models/tag'
import Team from '#models/team'
import TeamMember from '#models/team_member'
import IllustrationFactory from '#database/factories/IllustrationFactory'
import PlaceFactory from '#database/factories/PlaceFactory'
import _ from 'lodash'

function getPrivateTags(userId: number) {
  return [
    { name: 'Abomasum', user_id: userId, team_id: null },
    { name: 'Absquatulate', user_id: userId, team_id: null },
    { name: 'Adagio', user_id: userId, team_id: null },
    { name: 'Alfresco', user_id: userId, team_id: null },
    { name: 'Alcazar', user_id: userId, team_id: null },
    { name: 'Amok', user_id: userId, team_id: null },
    { name: 'Amphisbaena', user_id: userId, team_id: null },
    { name: 'Antimacassar', user_id: userId, team_id: null },
    { name: 'Atingle', user_id: userId, team_id: null },
    { name: 'Bailiwick', user_id: userId, team_id: null },
  ]
}

function getTeamTags(userId: number, teamId: number) {
  return [
    { name: 'Bafflegab', user_id: userId, team_id: teamId },
    { name: 'Ballistic', user_id: userId, team_id: teamId },
    { name: 'Bamboozle', user_id: userId, team_id: teamId },
    { name: 'Bedlam', user_id: userId, team_id: teamId },
    { name: 'Bugbear', user_id: userId, team_id: teamId },
    { name: 'Bulbous', user_id: userId, team_id: teamId },
    { name: 'Calamity', user_id: userId, team_id: teamId },
    { name: 'Calliope', user_id: userId, team_id: teamId },
    { name: 'Catamaran', user_id: userId, team_id: teamId },
    { name: 'Convivial', user_id: userId, team_id: teamId },
  ]
}

function getUser3TeamTags(userId: number, teamId: number) {
  return [
    { name: 'Cornucopia', user_id: userId, team_id: teamId },
    { name: 'Dazzle', user_id: userId, team_id: teamId },
    { name: 'Ebullient', user_id: userId, team_id: teamId },
    { name: 'Effervescent', user_id: userId, team_id: teamId },
    { name: 'Flabbergasted', user_id: userId, team_id: teamId },
    { name: 'Gargantuan', user_id: userId, team_id: teamId },
    { name: 'Hullabaloo', user_id: userId, team_id: teamId },
    { name: 'Jubilation', user_id: userId, team_id: teamId },
    { name: 'Kaleidoscope', user_id: userId, team_id: teamId },
    { name: 'Luminous', user_id: userId, team_id: teamId },
  ]
}

export default class IndexSeeder extends BaseSeeder {
  public async run() {
    await User.updateOrCreateMany('email', [
      { email: 'test@test.com', password: 'Test1234' },
      { email: 'test2@test.com', password: 'Test12345' },
      { email: 'test3@test.com', password: 'Test123456' },
    ])

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

    const tags1 = await Tag.createMany(getPrivateTags(1))
    const tags2 = await Tag.createMany(getTeamTags(2, team.id))
    const tags3 = await Tag.createMany(getUser3TeamTags(3, team.id))

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
