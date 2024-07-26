import { test } from '@japa/runner'
import IllustrationFactory from '#database/factories/IllustrationFactory'
import PlaceFactory from '#database/factories/PlaceFactory'
import Illustration from '#models/illustration'
import UserFactory from '#database/factories/UserFactory'
import Place from '#models/place'
import db from '@adonisjs/lucid/services/db'
let goodUser, badUser

test.group('Place', (group) => {
  // Write your test here
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })
  group.setup(async () => {
    goodUser = await UserFactory.merge({password: 'oasssadfasdf'}).create()
    badUser = await UserFactory.merge({password: 'oasssadfasdf'}).create() // bad user does not have access to good user
    // executed before all the tests for a given suite
    const illustration = await IllustrationFactory.merge({ title: 'Places Test', user_id: goodUser.id }).create()
    const place1 = await PlaceFactory.merge({ illustration_id: illustration.id, user_id: goodUser.id }).create()
    const place2 = await PlaceFactory.merge({ illustration_id: illustration.id, user_id: goodUser.id }).create()
    const place3 = await PlaceFactory.merge({ illustration_id: illustration.id, user_id: goodUser.id }).create()
    const place4 = await PlaceFactory.merge({ illustration_id: illustration.id, user_id: goodUser.id }).create()
    const place5 = await PlaceFactory.merge({ illustration_id: illustration.id, user_id: goodUser.id }).create()
  })

  group.teardown(async () => {
    await goodUser.delete()
    await badUser.delete()
  })

  test('Can get list of places on my specific illustration', async ({ client }) => {
    const loggedInUser = await client.post('/login').json({ email: goodUser.email, password: 'oasssadfasdf' })

    const illustration = await Illustration.findBy('title', 'Places Test')
    const response = await client.get(`/places/${illustration.id}`).bearerToken(loggedInUser.body().token)
    response.assertStatus(200)
  })

  test('Cannot get list of places on your specific illustration', async ({ client }) => {
    const loggedInUser = await client.post('/login').json({ email: badUser.email, password: 'oasssadfasdf' })
    const illustration = await Illustration.findBy('title', 'Places Test')
    const response = await client.get(`/places/${illustration.id}`).bearerToken(loggedInUser.body().token)
    response.assertStatus(403)
  })

  test('Can add new place to my illustration', async ({ client, assert }) => {
    const loggedInUser = await client.post('/login').json({ email: goodUser.email, password: 'oasssadfasdf' })

    const illustration = await Illustration.findByOrFail('title', 'Places Test')
    // not forcing the user ID here
    // also not using factory, which creates a user
    const place = {
      place: 'Gusikowski and Sons',
      location: 'South Tressie, South Dakota',
      used: '2023-03-11'
    }

    const response = await client.post(`/places/${illustration.id}`).bearerToken(loggedInUser.body().token).json(place)
    response.assertStatus(200)

    // console.log(response.body())
    assert.equal(response.body().message, 'Created successfully')
    assert.isNumber(response.body().id)
    const savedPlace = await Place.find(response.body().id)
    assert.equal(savedPlace.user_id,goodUser.id)

  })

  test('Cannot add new place to your illustration', async ({ client, assert }) => {

    const loggedInUser = await client.post('/login').json({ email: badUser.email, password: 'oasssadfasdf' })
    const illustration = await Illustration.findByOrFail('title', 'Places Test')
    const place = await PlaceFactory.make()

    const response = await client.post(`/places/${illustration.id}`).bearerToken(loggedInUser.body().token).json(place.toJSON())
    response.assertStatus(403)
    assert.equal(response.body().message,'You do not have permission to access this resource')

  })

  test('Can update my place', async ({ client, assert }) => {
    const loggedInUser = await client.post('/login').json({ email: goodUser.email, password: 'oasssadfasdf' })
    const illustration = await Illustration.findByOrFail('title', 'Places Test')
    const allPlaces = await illustration.related('places').query()
    const testPlace = allPlaces[0].toJSON()
    // console.log(allPlaces[0].toJSON())

    const updatedPlace = {
      place: 'my house',
      location: 'my bedroom',
      illustration_id: illustration.id
    }
    const response = await client.put(`/places/${testPlace.id}`).bearerToken(loggedInUser.body().token).json(updatedPlace)
    response.assertStatus(200)
    assert.equal(response.body().message,'Updated successfully')
  })

  test('Cannot update your place', async ({ client, assert }) => {

    const loggedInUser = await client.post('/login').json({ email: badUser.email, password: 'oasssadfasdf' })
    const illustration = await Illustration.findByOrFail('title', 'Places Test')
    const allPlaces = await illustration.related('places').query()
    const testPlace = allPlaces[0].toJSON()

    const updatedPlace = {
      place: 'my house',
      location: 'my bedroom',
      illustration_id: illustration.id
    }
    const response = await client.put(`/places/${testPlace.id}`).bearerToken(loggedInUser.body().token).json(updatedPlace)
    response.assertStatus(403)
    assert.equal(response.body().message,'You do not have permission to access this resource')
  })

  test('Fails on wrong illustration_id', async ({ client, assert }) => {
    const loggedInUser = await client.post('/login').json({ email: goodUser.email, password: 'oasssadfasdf' })
    const illustration = await Illustration.findByOrFail('title', 'Places Test')
    const allPlaces = await illustration.related('places').query()
    const testPlace = allPlaces[0].toJSON()
    const updatedPlace = {
      place: 'my house',
      illustration_id: 9999999999
    }

    const response = await client.put(`/places/${testPlace.id}`).bearerToken(loggedInUser.body().token).json(updatedPlace)
    response.assertStatus(403)
    assert.equal(response.body().message,'Error: Mismatched illustration_id')
  })

  test('Can delete place on my illustration', async ({ client, assert }) => {
    const loggedInUser = await client.post('/login').json({ email: goodUser.email, password: 'oasssadfasdf' })
    const illustration = await IllustrationFactory.merge({ title: 'Testing Place Delete' }).create()

    const place = await PlaceFactory.merge({illustration_id: illustration.id, user_id: goodUser.id}).create()

    const response = await client.delete(`/places/${place.id}`).bearerToken(loggedInUser.body().token)
    response.assertStatus(200)
    response.assertBodyContains({ 'message': `Deleted place id: ${place.id}` })

    // check to see the place is no longer there
    const deletedPlace = await Place.findBy('illustration_id', illustration.id)
    assert.isTrue(!deletedPlace)
  })

  test('Cannot delete place on your illustration', async ({ client, assert }) => {
    const loggedInUser = await client.post('/login').json({ email: badUser.email, password: 'oasssadfasdf' })
    const illustration = await IllustrationFactory.merge({title: 'Testing Place Delete'}).create()
    const place = await PlaceFactory.merge({illustration_id: illustration.id, user_id: goodUser.id}).create()

    const response = await client.delete(`/places/${place.id}`).bearerToken(loggedInUser.body().token)
    response.assertStatus(403)
    response.assertBodyContains({ 'message': 'You do not have permission to access this resource' })

  })

  test('Fail on creating to nonexistent illustration', async ({ client, assert }) => {
    const loggedInUser = await client.post('/login').json({ email: goodUser.email, password: 'oasssadfasdf' })
    const place = await PlaceFactory.merge({user_id: goodUser.id}).make()

    const response = await client.post(`/places/999999999999999999999999999999999`).bearerToken(loggedInUser.body().token).json(place.toJSON())
    response.assertStatus(404)
    assert.equal(response.body().message,'Illustration does not exist')
  })
})
