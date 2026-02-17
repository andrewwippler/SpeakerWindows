import { test } from '@japa/runner'
import Contact from '#models/contact'
import db from '@adonisjs/lucid/services/db'
import UserFactory from '#database/factories/UserFactory'

let goodUser, badUser

test.group('Contact', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })
  group.setup(async () => {
    goodUser = await UserFactory.merge({ password: 'oasssadfasdf' }).create()
    badUser = await UserFactory.merge({ password: 'oasssadfasdf' }).create() // bad user does not have access to good user
  })

  group.teardown(async () => {
    await goodUser.delete()
    await badUser.delete()
  })

  test('My user has settings when I log in', async ({ client }) => {
    const loggedInUser = await client
      .post('/login')
      .json({ email: goodUser.email, password: 'oasssadfasdf' })
    loggedInUser.assertStatus(200)

    loggedInUser.assertBodyContains({ settings: [{ place: 'Service' }] })
  })

  test('I can update my settings', async ({ client }) => {
    const response = await client
      .post('/login')
      .json({ email: goodUser.email, password: 'oasssadfasdf' })
    const token = response.body().token

    // post here
    const verify = await client.post(`/settings`).bearerToken(token).json({ place: 'nowhere' })
    verify.assertStatus(200)
    verify.assertBodyContains({ message: 'Settings saved!' })
    verify.assertBodyContains({ settings: { place: 'nowhere' } })
  })

  test('I can get my settings from /settings', async ({ client }) => {
    const response = await client
      .post('/login')
      .json({ email: goodUser.email, password: 'oasssadfasdf' })
    const token = response.body().token

    // get here
    const verify = await client.get(`/settings`).bearerToken(token)
    verify.assertStatus(200)
    verify.assertBodyContains({ location: 'Home' })
  })
})
