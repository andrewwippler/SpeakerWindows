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

test('get list of tags (i.e. index page)', async ({ client }) => {

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

test('Can get tags with search query', async ({ client, assert }) => {

  const response = await client.get('/tags/coo').end()

  response.assertStatus(200)
  assert.isTrue(response.body.length >= 2)
  assert.equal(response.body[0].name, 'Cooking')

})

test('403 on bad tag search', async ({ client }) => {

  const response = await client.get('/tags/zzzzzzzzzzzzzzzznotatagzzzzzzz').end()

  response.assertStatus(204)

  const zeroResponse = await client.get('/tags/0').end()

  zeroResponse.assertStatus(204)

})

test('Can update tag', async ({ client, assert }) => {
  const tag = await Tag.findBy('name', 'Adonis 101')

  const updatedTag = {name: 'Adonis 102'}

  const response = await client.put(`/tags/${tag.id}`).send(updatedTag).end()
  response.assertStatus(200)
  assert.equal(response.body.message, 'Updated successfully')

  const findTag = await Tag.find(tag.id)
  assert.equal(findTag.name, 'Adonis 102')

})

test('Can delete tag', async ({ client }) => {

  const tag = await Tag.create({ name: 'Delete Meh' })

  const response = await client.delete(`/tags/${tag.id}`).end()
  response.assertStatus(200)
  response.assertJSON({ 'message': `Deleted tag id: ${tag.id}` })

})

