import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import UserFactory from '#database/factories/user_factory'
import type User from '#models/user'
let goodUser: User
let badUser: User
let testIllustration: any

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
      .post('/api/login')
      .json({ email: goodUser.email, password: 'oasssadfasdf' })
    const secondLoggedInUser = await client
      .post('/api/login')
      .json({ email: badUser.email, password: 'oasssadfasdf' })

    testIllustration = {
      author: 'testy mctest',
      title: 'New Post',
      source: 'test',
      content: 'this shall pass as new',
    }
    await client
      .post('/api/illustration')
      .bearerToken(loggedInUser.body().token)
      .json(testIllustration)

    const second = {
      author: 'test2',
      title: 'New Post',
      source: 'test',
      content: 'this shall pass as new',
    }
    await client.post('/api/illustration').bearerToken(loggedInUser.body().token).json(second)
    await client.post('/api/illustration').bearerToken(secondLoggedInUser.body().token).json(second)

    const both = await client
      .get('/api/illustration/authors')
      .bearerToken(loggedInUser.body().token)
    const one = await client
      .get('/api/illustration/authors')
      .bearerToken(secondLoggedInUser.body().token)

    both.assertStatus(200)
    // With duplicate prevention (source+content), the second post with identical content
    // won't be created for the same user, so only one author should exist for loggedInUser
    assert.equal(both.body().length, 1)

    one.assertStatus(200)
    assert.equal(one.body().length, 1)

    const response = await client
      .get('/api/author/' + testIllustration.author)
      .bearerToken(loggedInUser.body().token)
    response.assertStatus(200)
    assert.equal(response.body().length, 1)
    const last = await client.get('/api/author/boogers').bearerToken(loggedInUser.body().token)
    last.assertStatus(204)
  })

  test('Update author', async ({ client, assert }) => {
    const loggedInUser = await client
      .post('/api/login')
      .json({ email: goodUser.email, password: 'oasssadfasdf' })

    testIllustration = {
      author: 'testy mctest',
      title: 'New Post',
      source: 'test',
      content: 'this shall pass as new',
    }
    await client
      .post('/api/illustration')
      .bearerToken(loggedInUser.body().token)
      .json(testIllustration)

    const response = await client
      .put('/api/author/' + testIllustration.author)
      .bearerToken(loggedInUser.body().token)
      .json({ author: 'new author' })
    response.assertStatus(200)
    assert.equal(response.body().message, 'Author updated from testy mctest to new author')
    const updated = await client
      .get('/api/author/new author')
      .bearerToken(loggedInUser.body().token)
    updated.assertStatus(200)
    assert.equal(updated.body().length, 1)
    const last = await client.get('/api/author/boogers').bearerToken(loggedInUser.body().token)
    last.assertStatus(204)
  })

  test('No authors returns 204', async ({ client }) => {
    const loggedInUser = await client
      .post('/api/login')
      .json({ email: goodUser.email, password: 'oasssadfasdf' })

    const response = await client
      .get('/api/illustration/authors')
      .bearerToken(loggedInUser.body().token)
    response.assertStatus(204)
  })

  test('Update author with no changes returns 400', async ({ client }) => {
    const loggedInUser = await client
      .post('/api/login')
      .json({ email: goodUser.email, password: 'oasssadfasdf' })

    const illustration = {
      author: 'testy mctest',
      title: 'New Post',
      source: 'test',
      content: 'this shall pass as new',
    }
    await client.post('/api/illustration').bearerToken(loggedInUser.body().token).json(illustration)

    const response = await client
      .put('/api/author/' + illustration.author)
      .bearerToken(loggedInUser.body().token)
      .json({ author: illustration.author })
    response.assertStatus(400)
  })

  test('Update author with non-existent author returns 200 with no results', async ({ client }) => {
    const loggedInUser = await client
      .post('/api/login')
      .json({ email: goodUser.email, password: 'oasssadfasdf' })

    const response = await client
      .put('/api/author/nonExistentAuthor')
      .bearerToken(loggedInUser.body().token)
      .json({ author: 'new author' })
    response.assertStatus(200)
  })
})
