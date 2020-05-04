'use strict'

const { test, trait, before, after } = use('Test/Suite')('Tag')
const Tag = use('App/Models/Tag')
const Database = use('Database')
const User = use('App/Models/User')
let goodUser, badUser

trait('Test/ApiClient')
trait('Auth/Client')

before(async () => {
  // executed before all the tests for a given suite
  const userLogins = [{email: 'tags@test.com', password: 'passworD1234'}, {email: 'bad_tags@test.com', password: 'passworD1234'},]
  const user = await User.createMany(userLogins)

  goodUser = user[0]
  badUser = user[1] // bad user does not have access to good user

  await Tag.createMany([{
    name: 'adonis 101',
    user_id: user[0].id
  },{
    name: 'cool is andrew',
    user_id: user[0].id
  },{
    name: 'cooking',
    user_id: user[0].id
  },{
    name: 'adonis is cool',
    user_id: user[0].id
  },{
    name: 'adonis is not cool',
    user_id: user[1].id
  }])
})

test('Can get list of my tags (i.e. index page)', async ({ client }) => {

  const response = await client.get('/tags').loginVia(goodUser, 'jwt').end()

  response.assertStatus(200)

})

test('Cannot get list of your tags', async ({ client }) => {

  const response = await client.get('/tags').loginVia(badUser, 'jwt').end()

  response.assertStatus(200)
  response.assertJSONSubset([{name: 'Adonis Is Not Cool'}])

})

test('Created tags are State Case', async ({ client }) => {
  const response = await client.get('/tags').loginVia(goodUser, 'jwt').end()

  response.assertStatus(200)
  response.assertJSONSubset([{
    name: 'Adonis 101',
  }])
  response.assertJSONSubset([{
    name: 'Adonis Is Cool',
  }])

})

test('Can get tags with search query', async ({ client, assert }) => {

  const response = await client.get('/tags/coo').loginVia(goodUser, 'jwt').end()

  response.assertStatus(200)
  assert.isTrue(response.body.length >= 2)
  assert.equal(response.body[0].name, 'Cooking')

})

test('Cannot get your tags', async ({ client, assert }) => {

  const response = await client.get('/tags/a').loginVia(badUser, 'jwt').end()

  response.assertStatus(200)
  assert.isTrue(response.body.length == 1)
  assert.equal(response.body[0].name, 'Adonis Is Not Cool')

})

test('403 on bad tag search', async ({ client }) => {

  const response = await client.get('/tags/zzzzzzzzzzzzzzzznotatagzzzzzzz').loginVia(goodUser, 'jwt').end()

  response.assertStatus(204)

  const zeroResponse = await client.get('/tags/0').loginVia(goodUser, 'jwt').end()

  zeroResponse.assertStatus(204)

})

test('Can update tag', async ({ client, assert }) => {
  const tag = await Tag.findBy('name', 'Adonis 101')

  const updatedTag = {name: 'Adonis 102'}

  const response = await client.put(`/tags/${tag.id}`).loginVia(goodUser, 'jwt').send(updatedTag).end()
  response.assertStatus(200)
  assert.equal(response.body.message, 'Updated successfully')

  const findTag = await Tag.find(tag.id)
  assert.equal(findTag.name, 'Adonis 102')

})

test('Cannot update your tag', async ({ client, assert }) => {
  const tag = await Tag.findBy('name', 'Adonis 102')

  const updatedTag = {name: 'Adonis 101'}

  const response = await client.put(`/tags/${tag.id}`).loginVia(badUser, 'jwt').send(updatedTag).end()
  response.assertStatus(403)
  assert.equal(response.body.message, 'You do not have permission to access this resource')

  const findTag = await Tag.find(tag.id)
  assert.equal(findTag.name, 'Adonis 102')

})

test('Can delete my tag', async ({ client }) => {

  const tag = await Tag.create({ name: 'Delete Meh', user_id: goodUser.id })

  const response = await client.delete(`/tags/${tag.id}`).loginVia(goodUser, 'jwt').end()
  response.assertStatus(200)
  response.assertJSON({ 'message': `Deleted tag id: ${tag.id}` })

})

test('Cannot delete your tag', async ({ client }) => {

  const tag = await Tag.create({ name: 'Do Not Delete Meh', user_id: goodUser.id })

  const response = await client.delete(`/tags/${tag.id}`).loginVia(badUser, 'jwt').end()
  response.assertStatus(403)
  response.assertJSON({ 'message': 'You do not have permission to access this resource' })

})
