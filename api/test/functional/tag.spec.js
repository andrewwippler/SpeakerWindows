'use strict'

const { test, trait, before, after } = use('Test/Suite')('Tag')
const Tag = use('App/Models/Tag')
const Database = use('Database')

trait('Test/ApiClient')

before(async () => {
  // executed before all the tests for a given suite
  await Tag.createMany([{
    name: 'adonis 101',
  },{
    name: 'cool is andrew',
  },{
    name: 'cooking',
  },{
    name: 'adonis is cool',
  }])
})

after(async () => {
  // executed after all the tests for a given suite
})

test('get list of tags', async ({ client }) => {

  const response = await client.get('/tags').end()

  response.assertStatus(200)

})

test('Created tags are State Case', async ({ client }) => {
  const response = await client.get('/tags').end()

  response.assertStatus(200)
  response.assertJSONSubset([{
    name: 'Adonis 101',
  }])
  response.assertJSONSubset([{
    name: 'Adonis Is Cool',
  }])

})

// test('Can get tags with search query', async ({ client }) => {

//   const response = await client.get('/tags?q=co').end()

//   response.assertStatus(200)
//   response.assertJSON([{
//     name: 'Cool Is Andrew',
//   }, {
//     name: 'Cooking',
//   }])

// })
