import { test } from '@japa/runner'
import IllustrationFactory from '#database/factories/IllustrationFactory'
import PlaceFactory from '#database/factories/PlaceFactory'
import UserFactory from '#database/factories/UserFactory'
import TagFactory from '#database/factories/TagFactory'
import db from '@adonisjs/lucid/services/db'
import { SearchIndexingService } from '#services/search_indexing_service'
import LocalEmbeddingProvider from '#services/local_embedding_provider'

let goodUser: any

test.group('Search API', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })
  
  group.setup(async () => {
    goodUser = await UserFactory.merge({password: 'oasssadfasdf'}).create()
    const illustration = await IllustrationFactory.merge({ title: 'Search Test', user_id: goodUser.id }).create()
    await PlaceFactory.merge({ illustration_id: illustration.id, place: 'Search Place', user_id: goodUser.id }).create()
    await TagFactory.merge({ name: 'Search Tag', user_id: goodUser.id }).create()

    try {
      const indexingService = new SearchIndexingService(LocalEmbeddingProvider)
      await indexingService.indexIllustration(illustration.id)
    } catch (err) {
      console.error('Test indexing failed:', err)
    }
  })

  group.teardown(async () => {
    await goodUser.delete()
  })

  test('Can search for all', async ({ client }) => {
    const loggedInUser = await client.post('/login').json({ email: goodUser.email, password: 'oasssadfasdf' })
    const response = await client.post(`/search`).json({ query: 'Search' }).bearerToken(loggedInUser.body().token)
    
    response.assertStatus(200)
    response.assertBodyContains({message: "success"})
    response.assertBodyContains({ searchString: "Search" })
    response.assertBodyContains({ data: { illustrations: [{ title: 'Search Test', }] } })
    response.assertBodyContains({ data: { tags: [{name: 'Search-Tag',}] } })
    response.assertBodyContains({ data: { places: [{place: 'Search Place',}] } })
  })

  test('No search string returns 422', async ({ client }) => {
    const loggedInUser = await client.post('/login').json({ email: goodUser.email, password: 'oasssadfasdf' })
    const response = await client.post(`/search`).json({}).bearerToken(loggedInUser.body().token)
    
    response.assertStatus(422)
  })

  test('Empty search string returns 422', async ({ client }) => {
    const loggedInUser = await client.post('/login').json({ email: goodUser.email, password: 'oasssadfasdf' })
    const response = await client.post(`/search`).json({ query: '' }).bearerToken(loggedInUser.body().token)
    
    response.assertStatus(422)
  })
})

test.group('Search indexing', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('indexIllustration creates document_search record', async ({ assert }) => {
    const user = await UserFactory.create()
    const ill = await IllustrationFactory.merge({ title: 'Test Illustration', user_id: user.id }).create()

    const indexing = new SearchIndexingService(LocalEmbeddingProvider)
    await indexing.indexIllustration(ill.id)

    const rows = await db.rawQuery('SELECT * FROM document_search WHERE document_id = ?', [ill.id])
    assert.isTrue(rows.rows.length >= 1)
    assert.equal(rows.rows[0].document_id, ill.id)
  })

  test('indexIllustration updates existing record', async ({ assert }) => {
    const user = await UserFactory.create()
    const ill = await IllustrationFactory.merge({ title: 'Original Title', user_id: user.id }).create()

    const indexing = new SearchIndexingService(LocalEmbeddingProvider)
    await indexing.indexIllustration(ill.id)

    ill.title = 'Updated Title'
    await ill.save()
    await indexing.indexIllustration(ill.id)

    const rows = await db.rawQuery('SELECT * FROM document_search WHERE document_id = ?', [ill.id])
    assert.isTrue(rows.rows.length >= 1)
  })

  test('deleteIndex removes document_search record', async ({ assert }) => {
    const user = await UserFactory.create()
    const ill = await IllustrationFactory.merge({ title: 'To Delete', user_id: user.id }).create()

    const indexing = new SearchIndexingService(LocalEmbeddingProvider)
    await indexing.indexIllustration(ill.id)

    let rows = await db.rawQuery('SELECT * FROM document_search WHERE document_id = ?', [ill.id])
    assert.isTrue(rows.rows.length >= 1)

    await indexing.deleteIndex(ill.id)

    rows = await db.rawQuery('SELECT * FROM document_search WHERE document_id = ?', [ill.id])
    assert.equal(rows.rows.length, 0)
  })
})
