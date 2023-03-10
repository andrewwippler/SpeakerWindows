import { test } from '@japa/runner'
import Database from '@ioc:Adonis/Lucid/Database'
import IllustrationFactory from 'Database/factories/IllustrationFactory'
import UserFactory from 'Database/factories/UserFactory'
import PlaceFactory from 'Database/factories/PlaceFactory'
import Illustration from 'App/Models/Illustration'
import TagFactory from 'Database/factories/TagFactory'
import Tag from 'App/Models/Tag'
import Place from 'App/Models/Place'
let goodUser, badUser, testTagIdOne, testTagIdTwo

test.group('Illustrations', (group) => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
    return () => Database.rollbackGlobalTransaction()
  })
  group.setup(async () => {

    goodUser = await UserFactory.merge({password: 'oasssadfasdf'}).create()
    badUser = await UserFactory.merge({password: 'oasssadfasdf'}).create() // bad user does not have access to good user

    // executed before all the tests for a given suite
    const illustration = await IllustrationFactory.merge({ title: 'Illustrations Test', user_id: goodUser.id }).create()
    const place1 = await PlaceFactory.merge({ user_id: goodUser.id }).make()
    const place2 = await PlaceFactory.merge({ user_id: goodUser.id }).make()
    const place3 = await PlaceFactory.merge({ user_id: goodUser.id }).make()
    const place4 = await PlaceFactory.merge({ user_id: goodUser.id }).make()
    const place5 = await PlaceFactory.merge({ user_id: goodUser.id }).make()
    illustration.related('places').saveMany(
      [
        place1,
        place2,
        place3,
        place4,
        place5
      ]
    )

      // executed before all the tests for a given suite
  const tags = await TagFactory.createMany(3)

  testTagIdOne = tags[0].id
  testTagIdTwo = tags[1].id

  await illustration.related('tags').attach([testTagIdOne])
  })

  group.teardown(async () => {
    await goodUser.delete()
    await badUser.delete()
  })

  test('Unauthenticated creation fails', async ({ client, assert }) => {
    const illustration =  {
      author: 'testy mctest',
      title: 'New Post',
      source: 'test',
      content: 'this shall pass as new',
    }
    const response = await client.post('/illustrations').json(illustration)
    response.assertStatus(401)

    // console.log(response.body())
    assert.equal(response.body().errors[0].message,'E_UNAUTHORIZED_ACCESS: You do not have permission to access this resource')
  })

  test('Create illustrations with user', async ({ client, assert }) => {
    const loggedInUser = await client.post('/login').json({ email: goodUser.email, password: 'oasssadfasdf' })

    const illustration =  {
      author: 'testy mctest',
      title: 'New Post',
      source: 'test',
      content: 'this shall pass as new',
    }
    const response = await client.post('/illustrations').bearerToken(loggedInUser.body().token).json(illustration)

    response.assertStatus(200)
    assert.equal(response.body().message,'Created successfully')
    assert.isNumber(response.body().id)

    const verify = await client.get(`/illustrations/${response.body().id}`).bearerToken(loggedInUser.body().token)
    verify.assertBodyContains(illustration)
  })

  test('Cannot access unowned illustration', async ({ client, assert }) => {
    const loggedInUser = await client.post('/login').json({ email: badUser.email, password: 'oasssadfasdf' })
    const illustration = await IllustrationFactory.merge({ title: 'Illustrations Test2', user_id: goodUser.id }).create()
// console.log("test",illustration.id,goodUser.id)
    const response = await client.get(`/illustrations/${illustration.id}`).bearerToken(loggedInUser.body().token)
    response.assertStatus(403)
    assert.equal(response.body().message,'You do not have permission to access this resource')
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
    const loggedInUser = await client.post('/login').json({ email: goodUser.email, password: 'oasssadfasdf' })
    const response = await client.post('/illustrations').bearerToken(loggedInUser.body().token).json(illus)

    response.assertStatus(200)
    assert.equal(response.body().message,'Created successfully')
    assert.isNumber(response.body().id)

    const verify = await client.get(`/illustrations/${response.body().id}`).bearerToken(loggedInUser.body().token)
    verify.assertStatus(200)
    // console.log(verify.body())
    assert.equal(verify.body().title, 'Testy Mctest') // should be State Case
    assert.equal(verify.body().tags[0].name, 'Home') // should be alphabetical
    assert.equal(verify.body().places[1].place, 'place1')
  })

  test('Create illustrations with lots of tags', async ({ client, assert }) => {

    const loggedInUser = await client.post('/login').json({ email: goodUser.email, password: 'oasssadfasdf' })

    const tags = [...Array(1000).keys()]
    const illus = {
      author: 'testing',
      title: 'testy mctest',
      source: 'test',
      content: 'this too shall pass',
      tags
    }
    const response = await client.post('/illustrations').bearerToken(loggedInUser.body().token).json(illus)

    response.assertStatus(200)
    assert.equal(response.body().message,'Created successfully')
    assert.isNumber(response.body().id)

    const verify = await client.get(`/illustrations/${response.body().id}`).bearerToken(loggedInUser.body().token)
    verify.assertStatus(200)

    const illustrationWithThousandTags = await Illustration.query()
      .where({ id: response.body().id })
      .preload('tags');
      const illustrationWithThousandTagsLength = await illustrationWithThousandTags[0].toJSON().tags.length
    assert.equal(illustrationWithThousandTagsLength, tags.length)
  })

  test('Illustration is not present in unrelated tag', async ({ client, assert }) => {
    const loggedInUser = await client.post('/login').json({ email: goodUser.email, password: 'oasssadfasdf' })

    const illustration = await Illustration.findByOrFail('title', 'Illustrations Test')
    const tag = await Tag.find(testTagIdTwo)
    const response = await client.get(`/illustrations/${illustration.id}`).bearerToken(loggedInUser.body().token)

    assert.equal(response.body().tags.length, 1)
    assert.notEqual(response.body().tags[0].name, tag.name)
  })

  test('Can update illustration with auth', async ({ client, assert }) => {

    const loggedInUser = await client.post('/login').json({ email: goodUser.email, password: 'oasssadfasdf' })
    const illustration = await Illustration.findBy('title', 'Illustrations Test')
    const tagTwo = await Tag.find(testTagIdTwo)
    const tagOne = await Tag.find(testTagIdOne)

    const illus = {
      author: 'Tester testing',
      title: 'Testy mctest tester 123',
      source: 'Testing',
      content: 'This, too, shall pass',
      tags: [tagOne.name, tagTwo.name, "third tag"]
    }

    const response = await client.put(`/illustrations/${illustration.id}`).bearerToken(loggedInUser.body().token).json(illus)
    response.assertStatus(200)
    assert.equal(response.body().message, 'Updated successfully')
    assert.equal(response.body().illustration.author, illus.author)
    assert.equal(response.body().illustration.title, illus.title)
    assert.equal(response.body().illustration.source, illus.source)
    assert.equal(response.body().illustration.content, illus.content)
    assert.equal(response.body().illustration.tags.length, 3)

  })

  test('Cannot update illustration wrong auth', async ({ client, assert }) => {
    const loggedInUser = await client.post('/login').json({ email: badUser.email, password: 'oasssadfasdf' })
    const illustration = await IllustrationFactory.merge({title: 'Tester', user_id: goodUser.id}).create()

    const illus = {
      author: 'Tester testing',
      title: 'Testy mctest tester 123',
      source: 'Testing',
      content: 'This, too, shall not pass',
    }

    const response = await client.put(`/illustrations/${illustration.id}`).bearerToken(loggedInUser.body().token).json(illus)
    response.assertStatus(403)
    assert.equal(response.body().message, 'You do not have permission to access this resource')

   })

  test('Can delete illustration with auth', async ({ client, assert }) => {
    const loggedInUser = await client.post('/login').json({ email: goodUser.email, password: 'oasssadfasdf' })

    const illustration = await IllustrationFactory.merge({title: 'Testing Delete', user_id: goodUser.id}).create()
    const tags = await TagFactory.merge({ name: 'Do Not Delete' }).make()
    const place = await PlaceFactory.make()

    await illustration.related('tags').attach([tags.id])
    await illustration.related('places').save(place)

    const response = await client.delete(`/illustrations/${illustration.id}`).bearerToken(loggedInUser.body().token)
    response.assertStatus(200)
    response.assertBodyContains({ 'message': `Deleted illustration id: ${illustration.id}` })

    const responseFourOhThree = await client.get(`/illustrations/${illustration.id}`).bearerToken(loggedInUser.body().token)
    responseFourOhThree.assertStatus(403)

    // check to see the place is no longer there
    const deletedPlace = await Place.findBy('illustration_id', illustration.id)
    assert.isTrue(!deletedPlace)

  })

  test('Cannot delete illustration wrong auth', async ({ client, assert }) => {
    const loggedInUser = await client.post('/login').json({ email: badUser.email, password: 'oasssadfasdf' })
    const goodloggedInUser = await client.post('/login').json({ email: goodUser.email, password: 'oasssadfasdf' })
    const illustration = await IllustrationFactory.merge({title: 'Testing Delete', user_id: goodUser.id}).create()
    const tags = await TagFactory.merge({ name: 'Do Not Delete' }).create()
    const place = await PlaceFactory.make()

    await illustration.related('tags').attach([tags.id])
    await illustration.related('places').save(place)

    const response = await client.delete(`/illustrations/${illustration.id}`).bearerToken(loggedInUser.body().token)
    response.assertStatus(403)
    response.assertBody({ 'message': `You do not have permission to access this resource` })

    const responseFourOhThree = await client.get(`/illustrations/${illustration.id}`).bearerToken(goodloggedInUser.body().token)
    responseFourOhThree.assertStatus(200)

  })

  test('403 on unknown illustration', async ({ client }) => {
    const response = await client.get('/illustrations/99999999999')
    response.assertStatus(401)
    response.assertBody({ errors: [{ "message": "E_UNAUTHORIZED_ACCESS: You do not have permission to access this resource" }] })
  })
})
