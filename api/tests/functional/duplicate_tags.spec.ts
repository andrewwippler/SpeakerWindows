import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import UserFactory from '#database/factories/user_factory'
import TeamFactory from '#database/factories/team_factory'
import IllustrationFactory from '#database/factories/illustration_factory'
import Tag from '#models/tag'
import { SearchIndexingService } from '#services/search_indexing_service'
import LocalEmbeddingProvider from '#services/local_embedding_provider'

function countMatches(text: string, pattern: RegExp): number {
  return text.match(pattern)?.length ?? 0
}

test.group('Duplicate tags', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('returns one preferred team tag from API tag endpoints', async ({ client, assert }) => {
    const user = await UserFactory.merge({ password: 'oasssadfasdf' }).create()
    const team = await TeamFactory.merge({ userId: user.id }).create()
    const personalTag = await Tag.create({ name: 'Tag', user_id: user.id })
    const teamTag = await Tag.create({ name: 'Tag', user_id: user.id, team_id: team.id })

    const login = await client
      .post('/api/login')
      .json({ email: user.email, password: 'oasssadfasdf' })
    const token = login.body().token

    const storedTags = await Tag.query()
      .where('name', 'Tag')
      .where('user_id', user.id)
      .orderBy('id')
    assert.lengthOf(storedTags, 2)
    assert.equal(storedTags[0].slug, `tag-${user.id}`)
    assert.equal(storedTags[1].slug, `tag-${user.id}-team-${team.id}`)

    const personalResponse = await client.get('/api/tags').bearerToken(token)
    personalResponse.assertStatus(200)
    assert.lengthOf(
      personalResponse.body().filter((tag: any) => tag.name === 'Tag'),
      1
    )
    assert.equal(
      personalResponse.body().find((tag: any) => tag.name === 'Tag').slug,
      personalTag.slug
    )

    const teamResponse = await client.get('/api/tags').qs({ team_id: team.id }).bearerToken(token)
    teamResponse.assertStatus(200)
    assert.lengthOf(
      teamResponse.body().filter((tag: any) => tag.name === 'Tag'),
      1
    )
    assert.equal(teamResponse.body().find((tag: any) => tag.name === 'Tag').slug, teamTag.slug)

    const tagSearchResponse = await client.get('/api/tags/tag').bearerToken(token)
    tagSearchResponse.assertStatus(200)
    assert.lengthOf(
      tagSearchResponse.body().filter((tag: any) => tag.name === 'Tag'),
      1
    )

    const teamTagSearchResponse = await client
      .get('/api/tags/tag')
      .qs({ team_id: team.id })
      .bearerToken(token)
    teamTagSearchResponse.assertStatus(200)
    assert.lengthOf(
      teamTagSearchResponse.body().filter((tag: any) => tag.name === 'Tag'),
      1
    )
    assert.equal(
      teamTagSearchResponse.body().find((tag: any) => tag.name === 'Tag').slug,
      teamTag.slug
    )

    const tagPageResponse = await client
      .get('/api/tag/tag')
      .qs({ team_id: team.id })
      .bearerToken(token)
    tagPageResponse.assertStatus(200)
    assert.equal(tagPageResponse.body().id, teamTag.id)
    assert.equal(tagPageResponse.body().name, 'Tag')
  })

  test('returns one preferred team tag from API search', async ({ client, assert }) => {
    const user = await UserFactory.merge({ password: 'oasssadfasdf' }).create()
    const team = await TeamFactory.merge({ userId: user.id }).create()
    await Tag.create({ name: 'Tag', user_id: user.id })
    const teamTag = await Tag.create({ name: 'Tag', user_id: user.id, team_id: team.id })

    const illustration = await IllustrationFactory.merge({
      title: 'Tag Search Fixture',
      user_id: user.id,
    }).create()
    const indexing = new SearchIndexingService(LocalEmbeddingProvider)
    await indexing.indexIllustration(illustration.id)

    const login = await client
      .post('/api/login')
      .json({ email: user.email, password: 'oasssadfasdf' })
    const response = await client
      .post('/api/search')
      .json({ query: 'Tag' })
      .bearerToken(login.body().token)

    response.assertStatus(200)
    const matchingTags = response.body().data.tags.filter((tag: any) => tag.name === 'Tag')
    assert.lengthOf(matchingTags, 1)
    assert.equal(matchingTags[0].slug, teamTag.slug)
    assert.lengthOf(await Tag.query().where('name', 'Tag').where('user_id', user.id), 2)
  })

  test('renders one tag on dashboard, illustration dropdowns, and search', async ({
    client,
    assert,
  }) => {
    const user = await UserFactory.create()
    const team = await TeamFactory.merge({ userId: user.id }).create()
    const personalTag = await Tag.create({ name: 'Tag', user_id: user.id })
    const teamTag = await Tag.create({ name: 'Tag', user_id: user.id, team_id: team.id })
    const illustration = await IllustrationFactory.merge({ user_id: user.id }).create()
    await illustration.related('tags').attach([personalTag.id, teamTag.id])

    const dashboard = await client.get('/').loginAs(user)
    dashboard.assertStatus(200)
    assert.equal(countMatches(dashboard.text(), /href="\/tags\/Tag"/g), 1)

    const newIllustration = await client.get('/illustrations/new').loginAs(user)
    newIllustration.assertStatus(200)
    assert.equal(countMatches(newIllustration.text(), /<option value="Tag"><\/option>/g), 1)

    const editIllustration = await client
      .get(`/illustrations/${illustration.id}/edit`)
      .loginAs(user)
    editIllustration.assertStatus(200)
    assert.equal(countMatches(editIllustration.text(), /<option value="Tag"><\/option>/g), 1)
    assert.equal(countMatches(editIllustration.text(), /<ot-taginput value="Tag">/g), 1)

    const search = await client
      .post('/search')
      .loginAs(user)
      .withCsrfToken()
      .form({ query: 'Tag', limit: 10 })
    search.assertStatus(200)
    assert.equal(countMatches(search.text(), /href="\/tags\/Tag"/g), 1)
  })
})
