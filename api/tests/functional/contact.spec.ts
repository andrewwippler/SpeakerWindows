import { test } from '@japa/runner'
import Contact from 'App/Models/Contact'
import Database from '@ioc:Adonis/Lucid/Database'

test.group('Contact', (group) => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
    return () => Database.rollbackGlobalTransaction()
  })
  // group.setup(async () => {

  // })

  // group.teardown(async () => {

  // })

  test('Can submit a contact form request', async ({ client }) => {
    const response = await client.post('/contact').json({
      email: 'test@test.com',
      reason: 'general',
      message: 'stuff here'
    })
    response.assertStatus(200)
    await Contact.findOrFail(response.body().id)

  })

})
