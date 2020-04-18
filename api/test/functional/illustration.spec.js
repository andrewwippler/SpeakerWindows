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

test('Create Illustrations with tags and places', async ({ client, assert }) => {
  const illus = {
    author: 'testing',
    title: 'testy mctest',
    source: 'test',
    content: 'this shall pass',
    tags: [
      'work', 'Home', 'testing camel case'
    ],
    places: [
      {
        place: 'place1',
        location: 'loc1',
        used: '2020-04-16 20:12:37',
      },
      {
        place: 'place2',
        location: 'loc2',
        used: '2020-04-16 19:52:37',
      }
    ]
  }
  const response = await client.post('/illustrations').send(illus).end()

  response.assertStatus(200)
  assert.equal(response.body.message,'Created successfully')
  assert.isNumber(response.body.id)

  const verify = await client.get('/illustrations/' + response.body.id).end()
  verify.assertStatus(200)
  assert.equal(verify.body.title, 'Testy Mctest') // should be State Case
  assert.equal(verify.body.tags[0].name, 'Home') // should be alphabetical
  assert.equal(verify.body.places[1].place, 'place1')
}).retry(3)

test('Create Illustrations with lots of tags', async ({ client, assert }) => {
  const tags = [...Array(1000).keys()]
  const illus = {
    author: 'testing',
    title: 'testy mctest',
    source: 'test',
    content: 'this too shall pass',
    tags
  }
  const response = await client.post('/illustrations').send(illus).end()

  response.assertStatus(200)
  assert.equal(response.body.message,'Created successfully')
  assert.isNumber(response.body.id)

  const verify = await client.get('/illustrations/' + response.body.id).end()
  verify.assertStatus(200)
})

test.skip('Update Illustration', async ({ client, assert }) => {
  const illustration = await Illustration.findBy('title', 'Tester')
  const tagTwo = await Tag.find(testTagIdTwo)
  const tagOne = await Tag.find(testTagIdOne)

  const illus = {
    author: 'Tester testing',
    title: 'Testy mctest tester 123',
    source: 'Testing',
    content: 'This, too, shall pass',
    tags: [tagOne.name, tagTwo.name]
  }
  console.log(illus)

  const response = await client.put('/illustrations/' + illustration.id).send(illus).end()
  response.assertStatus(200)
  assert.equal(response.body.message, 'Updated successfully')

 })

test.skip('Delete Illustration', async ({ client, assert }) => { })

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
