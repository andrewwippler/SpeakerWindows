'use strict'

const { test, trait } = use('Test/Suite')('Tag')
const Tag = use('App/Models/Tag')

trait('Test/ApiClient')

test('get list of tags', async ({ client }) => {

  const response = await client.get('/tags').end()

  response.assertStatus(200)

})

test('Created tags are State Case', async ({ client }) => {
  await Tag.create({
    name: 'adonis 101',
  })

  await Tag.create({
    name: 'adonis is cool',
  })

  const response = await client.get('/tags').end()

  response.assertStatus(200)
  response.assertJSONSubset([{
    name: 'Adonis 101',
  }])
  response.assertJSONSubset([{
    name: 'Adonis Is Cool',
  }])


})
