import { test } from '@japa/runner'
import type User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import UserFactory from '#database/factories/user_factory'

let goodUser: User

test.group('Contact', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })
  group.setup(async () => {
    goodUser = await UserFactory.merge({ password: 'oasssadfasdf' }).create()
  })

  test('My user has settings when I log in', async ({ client }) => {
    const loggedInUser = await client
      .post('/api/login')
      .json({ email: goodUser.email, password: 'oasssadfasdf' })
    loggedInUser.assertStatus(200)

    loggedInUser.assertBodyContains({ settings: [{ place: 'Service' }] })
  })

  test('I can update my settings', async ({ client }) => {
    const response = await client
      .post('/api/login')
      .json({ email: goodUser.email, password: 'oasssadfasdf' })
    const token = response.body().token

    // post here
    const verify = await client.post('/api/settings').bearerToken(token).json({ place: 'nowhere' })
    verify.assertStatus(200)
    verify.assertBodyContains({ message: 'Settings saved!' })
    verify.assertBodyContains({ settings: { place: 'nowhere' } })
  })

  test('I can get my settings from /settings', async ({ client }) => {
    const response = await client
      .post('/api/login')
      .json({ email: goodUser.email, password: 'oasssadfasdf' })
    const token = response.body().token

    // get here
    const verify = await client.get('/api/settings').bearerToken(token)
    verify.assertStatus(200)
    verify.assertBodyContains({ location: 'Home' })
  })
})
