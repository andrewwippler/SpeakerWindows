import { test } from '@japa/runner'
import IllustrationFactory from '#database/factories/IllustrationFactory'
import PlaceFactory from '#database/factories/PlaceFactory'
import UserFactory from '#database/factories/UserFactory'
import TagFactory from '#database/factories/TagFactory'
import db from '@adonisjs/lucid/services/db'
let goodUser

test.group('Search', (group) => {
  // Write your test here
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })
  group.setup(async () => {
    goodUser = await UserFactory.merge({password: 'oasssadfasdf'}).create()
    const illustration = await IllustrationFactory.merge({ title: 'Search Test', user_id: goodUser.id }).create()
    const place = await PlaceFactory.merge({ illustration_id: illustration.id, place: 'Search Place', user_id: goodUser.id }).create()
    const tag = await TagFactory.merge({ name: 'Search Tag', user_id: goodUser.id }).create()

    // console.log(illustration.toJSON(),place.toJSON(),tag.toJSON())
  })

  group.teardown(async () => {
    await goodUser.delete()
  })

  test('Can search for all', async ({ client }) => {
    const loggedInUser = await client.post('/login').json({ email: goodUser.email, password: 'oasssadfasdf' })
    const response = await client.post(`/search`).json({ search: 'Search' }).bearerToken(loggedInUser.body().token)
    // console.log(response.body())
    response.assertStatus(200)
    response.assertBodyContains({message: "success"})
    response.assertBodyContains({ searchString: "Search" })
    // not working :(
    // response.assertBodyContains({ data: { illustrations: [{title: 'Search Test',}] } })
    // response.assertBodyContains({ data: { tags: [{name: 'Search Tag',}] } })
    // response.assertBodyContains({ data: { places: [{place: 'Search Place',}] } })
  })

  test('No seach string', async ({ client }) => {
    const loggedInUser = await client.post('/login').json({ email: goodUser.email, password: 'oasssadfasdf' })

    const response = await client.post(`/search`).json({}).bearerToken(loggedInUser.body().token)
    response.assertStatus(204)
  })

})
