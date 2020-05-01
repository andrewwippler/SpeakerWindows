'use strict'

const { test, trait, before } = use('Test/Suite')('Place')
const Illustration = use('App/Models/Illustration')
const Place = use('App/Models/Place')
const Factory = use('Factory')

before(async () => {
  // executed before all the tests for a given suite
  const illustration = await Factory.model('App/Models/Illustration').create({title: 'Places Test'})
  const place = await Factory.model('App/Models/Place').makeMany(5)

  await illustration.places().saveMany(place)
})

trait('Test/ApiClient')

test('Get list of places on specific illustration', async ({ client }) => {

  const illustration = await Illustration.findByOrFail('title', 'Places Test')
  const response = await client.get(`/places/${illustration.id}`).end()
  response.assertStatus(200)
})

test('Can add new place to illustration', async ({ client, assert }) => {
  const illustration = await Illustration.findByOrFail('title', 'Places Test')
  const place = await Factory.model('App/Models/Place').make()

  const response = await client.post(`/places/${illustration.id}`).send(place.toJSON()).end()
  response.assertStatus(200)
  assert.equal(response.body.message,'Created successfully')
  assert.isNumber(response.body.id)

})

test('Can update place', async ({ client, assert }) => {
  const illustration = await Illustration.findByOrFail('title', 'Places Test')
  const allPlaces = await illustration.places().fetch()
  const testPlace = allPlaces.toJSON()[0]

  const updatedPlace = {
    place: 'my house',
    location: 'my bedroom',
    illustration_id: illustration.id
  }

  const response = await client.put(`/places/${testPlace.id}`).send(updatedPlace).end()
  response.assertStatus(200)
  assert.equal(response.body.message,'Updated successfully')
})

test('Fails on wrong illustration_id', async ({ client, assert }) => {
  const illustration = await Illustration.findByOrFail('title', 'Places Test')
  const allPlaces = await illustration.places().fetch()
  const testPlace = allPlaces.toJSON()[0]
  const updatedPlace = {
    place: 'my house',
    illustration_id: 9999999999
  }

  const response = await client.put(`/places/${testPlace.id}`).send(updatedPlace).end()
  response.assertStatus(403)
  assert.equal(response.body.message,'Error: Mismatched illustration_id')
})

test('Can delete place on illustration', async ({ client, assert }) => {
  const illustration = await Factory.model('App/Models/Illustration').create({title: 'Testing Place Delete'})
  const place = await Factory.model('App/Models/Place').make()

  await illustration.places().save(place)

  const response = await client.delete(`/places/${place.id}`).end()
  response.assertStatus(200)
  response.assertJSON({ 'message': `Deleted place id: ${place.id}` })

  // check to see the place is no longer there
  const deletedPlace = await Place.find({illustration_id: illustration.id})
  assert.isTrue(!deletedPlace)
})

test('Fail on creating to nonexistent illustration', async ({ client, assert }) => {
  const place = await Factory.model('App/Models/Place').make()

  const response = await client.post(`/places/999999999999999999999999999999999`).send(place.toJSON()).end()
  response.assertStatus(403)
  assert.equal(response.body.message,'Illustration does not exist')
})
