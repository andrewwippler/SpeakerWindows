'use strict'

const { test, trait, before } = use('Test/Suite')('Illustration')
const Illustration = use('App/Models/Illustration')
const Tag = use('App/Models/Tag')
const Factory = use('Factory')
let testTagIdOne, testTagIdTwo = 0

before(async () => {
  // executed before all the tests for a given suite
  const illustration = await Factory.model('App/Models/Illustration').create({title: 'Tester'})
  const tags = await Factory.model('App/Models/Tag').createMany(3)
  const place = await Factory.model('App/Models/Place').make()

  testTagIdOne = tags[0].id
  testTagIdTwo = tags[1].id
  await illustration.tags().attach(testTagIdOne)
  await illustration.places().save(place)
})

trait('Test/ApiClient')

test('Create Illustrations', async ({ client }) => {
  const illustration = await Illustration.findBy('title', 'Tester')
  const response = await client.get('/illustrations/'+illustration.id).end()

  response.assertStatus(200)
  response.assertJSONSubset({
    author: illustration.author,
    title: illustration.title,
    source: illustration.source,
    content: illustration.content
  })
})

test('Illustration is not present in unrelated tag', async ({ client, assert }) => {

  const illustration = await Illustration.findByOrFail('title', 'Tester')
  const tag = await Tag.find(testTagIdTwo)
  const response = await client.get('/illustrations/' + illustration.id).end()

  assert.equal(response.body.tags.length, 1)
  assert.notEqual(response.body.tags[0].name, tag.name)
})

test('403 on unknown illustration', async ({ client, assert }) => {
  const response = await client.get('/illustrations/99999999999').end()
  response.assertStatus(403)
  response.assertJSON({"message": "You are not allowed to access this resource"})
})
