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
    goodUser = await UserFactory.merge({ password: 'oasssadfasdf' }).create()
    const illustration = await IllustrationFactory.merge({
      title: 'Search Test',
      user_id: goodUser.id,
    }).create()
    await PlaceFactory.merge({
      illustration_id: illustration.id,
      place: 'Search Place',
      user_id: goodUser.id,
    }).create()
    await TagFactory.merge({ name: 'Search Tag', user_id: goodUser.id }).create()

    try {
      const indexingService = new SearchIndexingService(LocalEmbeddingProvider)
      await indexingService.indexIllustration(illustration.id)
    } catch (err) {
      console.error('Test indexing failed:', err)
    }
  })

  test('Can search for all', async ({ client }) => {
    const loggedInUser = await client
      .post('/login')
      .json({ email: goodUser.email, password: 'oasssadfasdf' })
    const response = await client
      .post(`/search`)
      .json({ query: 'Search' })
      .bearerToken(loggedInUser.body().token)

    response.assertStatus(200)
    response.assertBodyContains({ message: 'success' })
    response.assertBodyContains({ searchString: 'Search' })
    response.assertBodyContains({ data: { illustrations: [{ title: 'Search Test' }] } })
    response.assertBodyContains({ data: { tags: [{ name: 'Search-Tag' }] } })
    response.assertBodyContains({ data: { places: [{ place: 'Search Place' }] } })
    // const body = response.body()
    // console.log('Search response body:', body.data.illustrations, body.data.tags, body.data.places)
  })

  test('No search string returns 422', async ({ client }) => {
    const loggedInUser = await client
      .post('/login')
      .json({ email: goodUser.email, password: 'oasssadfasdf' })
    const response = await client.post(`/search`).json({}).bearerToken(loggedInUser.body().token)

    response.assertStatus(422)
  })

  test('Empty search string returns 422', async ({ client }) => {
    const loggedInUser = await client
      .post('/login')
      .json({ email: goodUser.email, password: 'oasssadfasdf' })
    const response = await client
      .post(`/search`)
      .json({ query: '' })
      .bearerToken(loggedInUser.body().token)

    response.assertStatus(422)
  })

  test('search returns illustrations with title match first alphabetically', async ({
    client,
    assert,
  }) => {
    const user = await UserFactory.create()
    const loggedInUser = await client
      .post('/login')
      .json({ email: goodUser.email, password: 'oasssadfasdf' })

    const ill1 = await IllustrationFactory.merge({
      title: 'Zebra Guide',
      user_id: goodUser.id,
    }).create()
    const ill2 = await IllustrationFactory.merge({
      title: 'Python Tutorial',
      user_id: goodUser.id,
    }).create()
    const ill3 = await IllustrationFactory.merge({
      title: 'Apple Book',
      user_id: goodUser.id,
    }).create()
    const ill4 = await IllustrationFactory.merge({
      title: 'Banana Recipe',
      user_id: goodUser.id,
    }).create()

    const indexing = new SearchIndexingService(LocalEmbeddingProvider)
    await indexing.indexIllustration(ill1.id)
    await indexing.indexIllustration(ill2.id)
    await indexing.indexIllustration(ill3.id)
    await indexing.indexIllustration(ill4.id)

    const response = await client
      .post(`/search`)
      .json({ query: 'Python' })
      .bearerToken(loggedInUser.body().token)

    response.assertStatus(200)
    const titles = response.body().data.illustrations.map((ill: any) => ill.title)
    const pythonMatch = titles.findIndex((t: string) => t === 'Python Tutorial')
    assert.isTrue(pythonMatch >= 0)
    const pythonResults = titles.slice(0, pythonMatch + 1)
    const remainingResults = titles.slice(pythonMatch + 1)
    assert.equal(pythonResults[0], 'Python Tutorial')
    const sortedRemaining = [...remainingResults].sort((a, b) => a.localeCompare(b))
    assert.deepEqual(remainingResults, sortedRemaining)
  })
})

test.group('Search indexing', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('indexIllustration creates document_search record', async ({ assert }) => {
    const user = await UserFactory.create()
    const ill = await IllustrationFactory.merge({
      title: 'Test Illustration',
      user_id: user.id,
    }).create()

    const indexing = new SearchIndexingService(LocalEmbeddingProvider)
    await indexing.indexIllustration(ill.id)

    const rows = await db.rawQuery('SELECT * FROM document_search WHERE document_id = ?', [ill.id])
    assert.isTrue(rows.rows.length >= 1)
    assert.equal(rows.rows[0].document_id, ill.id)
  })

  test('indexIllustration updates existing record', async ({ assert }) => {
    const user = await UserFactory.create()
    const ill = await IllustrationFactory.merge({
      title: 'Original Title',
      user_id: user.id,
    }).create()

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
