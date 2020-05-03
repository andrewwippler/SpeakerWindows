'use strict'

const { test, trait, before } = use('Test/Suite')('Illustration')
const Illustration = use('App/Models/Illustration')
const Tag = use('App/Models/Tag')
const User = use('App/Models/User')
const Place = use('App/Models/Place')
const Factory = use('Factory')
let testTagIdOne, testTagIdTwo = 0
let goodUser, badUser

before(async () => {
  // executed before all the tests for a given suite
  const userLogins = [{email: 'illustrations@test.com', password: 'passworD1234'}, {email: 'bad_illustrations@test.com', password: 'passworD1234'},]
  const user = await User.createMany(userLogins)
  const illustration = await Factory.model('App/Models/Illustration').create({title: 'Tester', user_id: user[0].id})
  const tags = await Factory.model('App/Models/Tag').createMany(3)
  const place = await Factory.model('App/Models/Place').make()

  testTagIdOne = tags[0].id
  testTagIdTwo = tags[1].id
  goodUser = user[0]
  badUser = user[1] // bad user does not have access to good user
  await illustration.tags().attach(testTagIdOne)
  await illustration.places().save(place)
})

trait('Test/ApiClient')
trait('Auth/Client')

test('Unauthenticated creation fails', async ({ client, assert }) => {
  const illustration =  {
    author: 'testy mctest',
    title: 'New Post',
    source: 'test',
    content: 'this shall pass as new',
  }
  const response = await client.post('/illustrations').send(illustration).end()
  response.assertStatus(401)

  assert.equal(response.body.message,'You must be authenticated to perform this action.')
})

test('Create illustrations with user', async ({ client, assert }) => {
  const illustration =  {
    author: 'testy mctest',
    title: 'New Post',
    source: 'test',
    content: 'this shall pass as new',
  }
  const response = await client.post('/illustrations').loginVia(goodUser, 'jwt').send(illustration).end()

  response.assertStatus(200)
  assert.equal(response.body.message,'Created successfully')
  assert.isNumber(response.body.id)

  const verify = await client.get(`/illustrations/${response.body.id}`).loginVia(goodUser, 'jwt').end()
  verify.assertJSONSubset(illustration)
})

test('Cannot access unowned illustration', async ({ client, assert }) => {
  const illustration = await Illustration.findBy({ title: 'Tester' })

  const response = await client.get(`/illustrations/${illustration.id}`).loginVia(badUser, 'jwt').end()
  response.assertStatus(403)
  assert.equal(response.body.message,'You do not have permission to access this resource')
})

test('Create illustrations with tags and places', async ({ client, assert }) => {
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
  const response = await client.post('/illustrations').loginVia(goodUser, 'jwt').send(illus).end()

  response.assertStatus(200)
  assert.equal(response.body.message,'Created successfully')
  assert.isNumber(response.body.id)

  const verify = await client.get(`/illustrations/${response.body.id}`).loginVia(goodUser, 'jwt').end()
  verify.assertStatus(200)
  assert.equal(verify.body.title, 'Testy Mctest') // should be State Case
  assert.equal(verify.body.tags[0].name, 'Home') // should be alphabetical
  assert.equal(verify.body.places[1].place, 'place1')
}).retry(3)

test('Create illustrations with lots of tags', async ({ client, assert }) => {
  const tags = [...Array(1000).keys()]
  const illus = {
    author: 'testing',
    title: 'testy mctest',
    source: 'test',
    content: 'this too shall pass',
    tags
  }
  const response = await client.post('/illustrations').loginVia(goodUser, 'jwt').send(illus).end()

  response.assertStatus(200)
  assert.equal(response.body.message,'Created successfully')
  assert.isNumber(response.body.id)

  const verify = await client.get(`/illustrations/${response.body.id}`).loginVia(goodUser, 'jwt').end()
  verify.assertStatus(200)

  const illustrationWithThousandTags = await Illustration.query()
    .where({ id: response.body.id })
    .with('tags')
    .fetch();
    const illustrationWithThousandTagsLength = await illustrationWithThousandTags.toJSON()[0].tags.length
  assert.equal(illustrationWithThousandTagsLength, tags.length)
}).retry(2)

test('Illustration is not present in unrelated tag', async ({ client, assert }) => {

  const illustration = await Illustration.findByOrFail('title', 'Tester')
  const tag = await Tag.find(testTagIdTwo)
  const response = await client.get(`/illustrations/${illustration.id}`).loginVia(goodUser, 'jwt').end()

  assert.equal(response.body.tags.length, 1)
  assert.notEqual(response.body.tags[0].name, tag.name)
})

test('Can update illustration with auth', async ({ client, assert }) => {
  const illustration = await Illustration.findBy('title', 'Tester')
  const tagTwo = await Tag.find(testTagIdTwo)
  const tagOne = await Tag.find(testTagIdOne)

  const illus = {
    author: 'Tester testing',
    title: 'Testy mctest tester 123',
    source: 'Testing',
    content: 'This, too, shall pass',
    tags: [tagOne.name, tagTwo.name, "third tag"]
  }

  const response = await client.put(`/illustrations/${illustration.id}`).loginVia(goodUser, 'jwt').send(illus).end()
  response.assertStatus(200)
  assert.equal(response.body.message, 'Updated successfully')
  assert.equal(response.body.illustration.author, illus.author)
  assert.equal(response.body.illustration.title, illus.title)
  assert.equal(response.body.illustration.source, illus.source)
  assert.equal(response.body.illustration.content, illus.content)
  assert.equal(response.body.illustration.tags.length, 3)

})

test('Cannot update illustration wrong auth', async ({ client, assert }) => {
  const illustration = await Factory.model('App/Models/Illustration').create({title: 'Tester', user_id: goodUser.id})

  const illus = {
    author: 'Tester testing',
    title: 'Testy mctest tester 123',
    source: 'Testing',
    content: 'This, too, shall not pass',
  }

  const response = await client.put(`/illustrations/${illustration.id}`).loginVia(badUser, 'jwt').send(illus).end()
  response.assertStatus(403)
  assert.equal(response.body.message, 'You do not have permission to access this resource')

 })

test('Can delete illustration with auth', async ({ client, assert }) => {
  const illustration = await Factory.model('App/Models/Illustration').create({title: 'Testing Delete', user_id: goodUser.id})
  const tags = await Factory.model('App/Models/Tag').create({ name: 'Do Not Delete' })
  const place = await Factory.model('App/Models/Place').make()

  await illustration.tags().attach(tags.id)
  await illustration.places().save(place)

  const response = await client.delete(`/illustrations/${illustration.id}`).loginVia(goodUser, 'jwt').end()
  response.assertStatus(200)
  response.assertJSON({ 'message': `Deleted illustration id: ${illustration.id}` })

  const responseFourOhThree = await client.get(`/illustrations/${illustration.id}`).loginVia(goodUser, 'jwt').end()
  responseFourOhThree.assertStatus(403)

  // check to see the place is no longer there
  const deletedPlace = await Place.find({illustration_id: illustration.id})
  assert.isTrue(!deletedPlace)

})

test('Cannot delete illustration wrong auth', async ({ client, assert }) => {
  const illustration = await Factory.model('App/Models/Illustration').create({title: 'Testing Delete', user_id: goodUser.id})
  const tags = await Factory.model('App/Models/Tag').create({ name: 'Do Not Delete' })
  const place = await Factory.model('App/Models/Place').make()

  await illustration.tags().attach(tags.id)
  await illustration.places().save(place)

  const response = await client.delete(`/illustrations/${illustration.id}`).loginVia(badUser, 'jwt').end()
  response.assertStatus(403)
  response.assertJSON({ 'message': `You do not have permission to access this resource` })

  const responseFourOhThree = await client.get(`/illustrations/${illustration.id}`).loginVia(goodUser, 'jwt').end()
  responseFourOhThree.assertStatus(200)

})

test('403 on unknown illustration', async ({ client }) => {
  const response = await client.get('/illustrations/99999999999').loginVia(goodUser, 'jwt').end()
  response.assertStatus(403)
  response.assertJSON({"message": "You do not have permission to access this resource"})
})
