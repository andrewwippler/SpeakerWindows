'use strict'

const { test, trait, before } = use('Test/Suite')('Place')
const Illustration = use('App/Models/Illustration')
const Place = use('App/Models/Place')
const Factory = use('Factory')
const User = use('App/Models/User')
let goodUser, badUser

trait('Test/ApiClient')
trait('Auth/Client')

before(async () => {

  const userLogins = [{email: 'places@test.com', password: 'passworD1234'}, {email: 'bad_places@test.com', password: 'passworD1234'},]
  const user = await User.createMany(userLogins)

  goodUser = user[0]
  badUser = user[1] // bad user does not have access to good user

  // executed before all the tests for a given suite
  const illustration = await Factory.model('App/Models/Illustration').create({title: 'Places Test', user_id: goodUser.id})
  const place1 = await Factory.model('App/Models/Place').make({ user_id: goodUser.id })
  const place2 = await Factory.model('App/Models/Place').make({ user_id: goodUser.id })
  const place3 = await Factory.model('App/Models/Place').make({ user_id: goodUser.id })
  const place4 = await Factory.model('App/Models/Place').make({ user_id: goodUser.id })
  const place5 = await Factory.model('App/Models/Place').make({ user_id: goodUser.id })
  await illustration.places().saveMany(
    [
      place1,
      place2,
      place3,
      place4,
      place5
    ]
  )
})

test('Can get list of places on my specific illustration', async ({ client }) => {

  const illustration = await Illustration.findBy('title', 'Places Test')
  const response = await client.get(`/places/${illustration.id}`).loginVia(goodUser, 'jwt').end()
  response.assertStatus(200)
})

test('Cannot get list of places on your specific illustration', async ({ client }) => {

  const illustration = await Illustration.findBy('title', 'Places Test')
  const response = await client.get(`/places/${illustration.id}`).loginVia(badUser, 'jwt').end()
  response.assertStatus(403)
})

test('Can add new place to my illustration', async ({ client, assert }) => {
  const illustration = await Illustration.findByOrFail('title', 'Places Test')
  const place = await Factory.model('App/Models/Place').make()

  const response = await client.post(`/places/${illustration.id}`).loginVia(goodUser, 'jwt').send(place.toJSON()).end()
  response.assertStatus(200)
  assert.equal(response.body.message,'Created successfully')
  assert.isNumber(response.body.id)

})

test('Cannot add new place to your illustration', async ({ client, assert }) => {
  const illustration = await Illustration.findByOrFail('title', 'Places Test')
  const place = await Factory.model('App/Models/Place').make()

  const response = await client.post(`/places/${illustration.id}`).loginVia(badUser, 'jwt').send(place.toJSON()).end()
  response.assertStatus(403)
  assert.equal(response.body.message,'You do not have permission to access this resource')

})

test('Can update my place', async ({ client, assert }) => {
  const illustration = await Illustration.findByOrFail('title', 'Places Test')
  const allPlaces = await illustration.places().fetch()
  const testPlace = allPlaces.toJSON()[0]

  const updatedPlace = {
    place: 'my house',
    location: 'my bedroom',
    illustration_id: illustration.id
  }
  const response = await client.put(`/places/${testPlace.id}`).loginVia(goodUser, 'jwt').send(updatedPlace).end()
  response.assertStatus(200)
  assert.equal(response.body.message,'Updated successfully')
})

test('Cannot update your place', async ({ client, assert }) => {
  const illustration = await Illustration.findByOrFail('title', 'Places Test')
  const allPlaces = await illustration.places().fetch()
  const testPlace = allPlaces.toJSON()[0]

  const updatedPlace = {
    place: 'my house',
    location: 'my bedroom',
    illustration_id: illustration.id
  }
  const response = await client.put(`/places/${testPlace.id}`).loginVia(badUser, 'jwt').send(updatedPlace).end()
  response.assertStatus(403)
  assert.equal(response.body.message,'You do not have permission to access this resource')
})

test('Fails on wrong illustration_id', async ({ client, assert }) => {
  const illustration = await Illustration.findByOrFail('title', 'Places Test')
  const allPlaces = await illustration.places().fetch()
  const testPlace = allPlaces.toJSON()[0]
  const updatedPlace = {
    place: 'my house',
    illustration_id: 9999999999
  }

  const response = await client.put(`/places/${testPlace.id}`).loginVia(goodUser, 'jwt').send(updatedPlace).end()
  response.assertStatus(403)
  assert.equal(response.body.message,'Error: Mismatched illustration_id')
})

test('Can delete place on my illustration', async ({ client, assert }) => {
  const illustration = await Factory.model('App/Models/Illustration').create({title: 'Testing Place Delete'})
  const place = await Factory.model('App/Models/Place').make({user_id: goodUser.id})

  await illustration.places().save(place)

  const response = await client.delete(`/places/${place.id}`).loginVia(goodUser, 'jwt').end()
  response.assertStatus(200)
  response.assertJSON({ 'message': `Deleted place id: ${place.id}` })

  // check to see the place is no longer there
  const deletedPlace = await Place.find({illustration_id: illustration.id})
  assert.isTrue(!deletedPlace)
})

test('Cannot delete place on your illustration', async ({ client, assert }) => {
  const illustration = await Factory.model('App/Models/Illustration').create({title: 'Testing Place Delete'})
  const place = await Factory.model('App/Models/Place').make({user_id: goodUser.id})

  await illustration.places().save(place)

  const response = await client.delete(`/places/${place.id}`).loginVia(badUser, 'jwt').end()
  response.assertStatus(403)
  response.assertJSON({ 'message': 'You do not have permission to access this resource' })

})

test('Fail on creating to nonexistent illustration', async ({ client, assert }) => {
  const place = await Factory.model('App/Models/Place').make({user_id: goodUser.id})

  const response = await client.post(`/places/999999999999999999999999999999999`).loginVia(goodUser, 'jwt').send(place.toJSON()).end()
  response.assertStatus(403)
  assert.equal(response.body.message,'Illustration does not exist')
})
