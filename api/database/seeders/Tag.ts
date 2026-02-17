import { BaseSeeder } from '@adonisjs/lucid/seeders'
import TagFactory from '#database/factories/TagFactory'
import Tag from '#models/tag'

async function getTags(user) {
  if (user == 1) {
    return [
      {
        name: 'Abomasum',
        user_id: user,
      },
      {
        name: 'Absquatulate',
        user_id: user,
      },
      {
        name: 'Adagio',
        user_id: user,
      },
      {
        name: 'Alfresco',
        user_id: user,
      },
      {
        name: 'Alcazar',
        user_id: user,
      },
      {
        name: 'Amok',
        user_id: user,
      },
      {
        name: 'Amphisbaena',
        user_id: user,
      },
      {
        name: 'Antimacassar',
        user_id: user,
      },
      {
        name: 'Atingle',
        user_id: user,
      },
      {
        name: 'Bailiwick',
        user_id: user,
      },
    ]
  }
  return [
    {
      name: 'Bafflegab',
      user_id: user,
    },
    {
      name: 'Ballistic',
      user_id: user,
    },
    {
      name: 'Bamboozle',
      user_id: user,
    },
    {
      name: 'Bedlam',
      user_id: user,
    },
    {
      name: 'Bugbear',
      user_id: user,
    },
    {
      name: 'Bulbous',
      user_id: user,
    },
    {
      name: 'Calamity',
      user_id: user,
    },
    {
      name: 'Calliope',
      user_id: user,
    },
    {
      name: 'Catamaran',
      user_id: user,
    },
    {
      name: 'Convivial',
      user_id: user,
    },
    {
      name: 'Cornucopia',
      user_id: user,
    },
  ]
}

export default class extends BaseSeeder {
  public async run() {
    const tags = await TagFactory.merge(await getTags(1)).makeMany(10)
    const tagsTwo = await TagFactory.merge(await getTags(2)).makeMany(10)

    await Tag.fetchOrCreateMany('name', tags)
    await Tag.fetchOrCreateMany('name', tagsTwo)
  }
}
