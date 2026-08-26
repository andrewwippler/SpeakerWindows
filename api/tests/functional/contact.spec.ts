import { test } from '@japa/runner'
import Contact from '#models/contact'
import db from '@adonisjs/lucid/services/db'

test.group('Contact', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('Can submit a contact form request', async ({ client }) => {
    const response = await client.post('/api/contact').json({
      email: 'test@test.com',
      reason: 'general',
      message: 'stuff here',
    })
    response.assertStatus(200)
    await Contact.findOrFail(response.body().id)
  })

  test('Errors submit a contact form request', async ({ client }) => {
    const response = await client
      .post('/api/contact')
      .accept('json') // Tells AdonisJS to return JSON instead of redirecting
      .json({})
    response.assertStatus(422)
  })
})
