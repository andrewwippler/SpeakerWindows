import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import IllustrationFactory from '#database/factories/IllustrationFactory'
import UserFactory from '#database/factories/UserFactory'
import PlaceFactory from '#database/factories/PlaceFactory'
import Illustration from '#models/illustration'
import TagFactory from '#database/factories/TagFactory'
import Tag from '#models/tag'
import Place from '#models/place'
import User from '#models/user'
import { ModelObject } from '@adonisjs/lucid/types/model'
let goodUser: User,
  badUser: User,
  testTagIdOne: string | number | ModelObject,
  testTagIdTwo: number,
  illustration

test.group('Authors', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })
  group.setup(async () => {
    goodUser = await UserFactory.merge({ password: 'oasssadfasdf' }).create()
    badUser = await UserFactory.merge({ password: 'oasssadfasdf' }).create() // bad user does not have access to good user
  })

  test('Author routes', async ({ client, assert }) => {
    const loggedInUser = await client
      .post('/login')
      .json({ email: goodUser.email, password: 'oasssadfasdf' })
    const secondLoggedInUser = await client
      .post('/login')
      .json({ email: badUser.email, password: 'oasssadfasdf' })

    const illustration = {
      author: 'testy mctest',
      title: 'New Post',
      source: 'test',
      content: 'this shall pass as new',
    }
    await client.post('/illustration').bearerToken(loggedInUser.body().token).json(illustration)

    const second = {
      author: 'test2',
      title: 'New Post',
      source: 'test',
      content: 'this shall pass as new',
    }
    await client.post('/illustration').bearerToken(loggedInUser.body().token).json(second)
    await client.post('/illustration').bearerToken(secondLoggedInUser.body().token).json(second)

    const both = await client.get('/illustration/authors').bearerToken(loggedInUser.body().token)
    const one = await client
      .get('/illustration/authors')
      .bearerToken(secondLoggedInUser.body().token)

    both.assertStatus(200)
    // With duplicate prevention (source+content), the second post with identical content
    // won't be created for the same user, so only one author should exist for loggedInUser
    assert.equal(both.body().length, 1)

    one.assertStatus(200)
    assert.equal(one.body().length, 1)

    const response = await client
      .get('/author/' + illustration.author)
      .bearerToken(loggedInUser.body().token)
    response.assertStatus(200)
    assert.equal(response.body().length, 1)
    const last = await client.get('/author/boogers').bearerToken(loggedInUser.body().token)
    last.assertStatus(204)
  })

  test('Update author', async ({ client, assert }) => {
    const loggedInUser = await client
      .post('/login')
      .json({ email: goodUser.email, password: 'oasssadfasdf' })

    const illustration = {
      author: 'testy mctest',
      title: 'New Post',
      source: 'test',
      content: 'this shall pass as new',
    }
    await client.post('/illustration').bearerToken(loggedInUser.body().token).json(illustration)

    const response = await client
      .put('/author/' + illustration.author)
      .bearerToken(loggedInUser.body().token)
      .json({ author: 'new author' })
    response.assertStatus(200)
    assert.equal(response.body().message, 'Author updated from testy mctest to new author')
    const updated = await client.get('/author/new author').bearerToken(loggedInUser.body().token)
    updated.assertStatus(200)
    assert.equal(updated.body().length, 1)
    const last = await client.get('/author/boogers').bearerToken(loggedInUser.body().token)
    last.assertStatus(204)
  })
})
