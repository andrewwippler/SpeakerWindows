import { test } from '@japa/runner'
import UserFactory from '#database/factories/UserFactory'
import Tag from '#models/tag'
import TagFactory from '#database/factories/TagFactory'
import IllustrationFactory from '#database/factories/IllustrationFactory'
import db from '@adonisjs/lucid/services/db'
let goodUser, badUser

test.group('Tag', (group) => {
  // Write your test here
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })
  group.setup(async () => {
    // executed before all the tests for a given suite

    goodUser = await UserFactory.merge({ password: 'oasssadfasdf' }).create()
    badUser = await UserFactory.merge({ password: 'oasssadfasdf' }).create() // bad user does not have access to good user

    await Tag.createMany([
      {
        name: 'adonis 101',
        user_id: goodUser.id,
      },
      {
        name: 'adonis update me',
        user_id: goodUser.id,
      },
      {
        name: 'cool is andrew',
        user_id: goodUser.id,
      },
      {
        name: 'cooking',
        user_id: goodUser.id,
      },
      {
        name: 'adonis is cool',
        user_id: goodUser.id,
      },
      {
        name: 'adonis is not cool',
        user_id: badUser.id,
      },
      {
        name: 'boogers is not cool',
        user_id: goodUser.id,
      },
    ])
  })

  group.teardown(async () => {
    await goodUser.delete()
    await badUser.delete()
  })

  test('Can get list of my tags (i.e. index page)', async ({ client }) => {
    const loggedInUser = await client
      .post('/login')
      .json({ email: goodUser.email, password: 'oasssadfasdf' })

    const response = await client.get('/tags').bearerToken(loggedInUser.body().token)

    response.assertStatus(200)

    // { id: 9, name: 'Adonis 101' },
    // { id: 12, name: 'Adonis Is Cool' },
    // { id: 11, name: 'Cooking' },
    // { id: 10, name: 'Cool Is Andrew' }
  })

  test('Can get list of my illustrations (i.e. tag index page)', async ({ client, assert }) => {
    const loggedInUser = await client
      .post('/login')
      .json({ email: goodUser.email, password: 'oasssadfasdf' })

    const illustration = await IllustrationFactory.merge({
      title: 'Testing tag selection',
      user_id: goodUser.id,
    }).create()
    const illustration2 = await IllustrationFactory.merge({
      title: 'Testing tag selection2',
      user_id: goodUser.id,
    }).create()
    const tags = await TagFactory.merge({ name: 'Searching' }).create()
    const tags2 = await TagFactory.merge({ name: 'Searching2' }).create()
    await illustration.related('tags').attach([tags.id])
    await illustration2.related('tags').attach([tags2.id])

    const response = await client.get('/tag/Searching').bearerToken(loggedInUser.body().token)

    response.assertStatus(200)
    // console.log(response.body())
    assert.isTrue(response.body().name == 'Searching')
    assert.isTrue(response.body().id == tags.id)
    assert.isTrue(response.body().illustrations.length == 1)
  })

  test('Cannot get list of your tags', async ({ client, assert }) => {
    const loggedInUser = await client
      .post('/login')
      .json({ email: badUser.email, password: 'oasssadfasdf' })

    const response = await client.get('/tags').bearerToken(loggedInUser.body().token)

    response.assertStatus(200)
    // console.log(response.body())
    // response.assert?.equal(response.body().length,1)
    assert.equal(response.body()[0].name, 'Adonis-Is-Not-Cool')
  })

  test('Created tags are State Case', async ({ client }) => {
    const loggedInUser = await client
      .post('/login')
      .json({ email: goodUser.email, password: 'oasssadfasdf' })

    const response = await client.get('/tags').bearerToken(loggedInUser.body().token)

    response.assertStatus(200)
    response.assertBodyContains([
      {
        name: 'Adonis-101',
      },
    ])
    response.assertBodyContains([
      {
        name: 'Adonis-Is-Cool',
      },
    ])
  })

  test('Can get tags with search query', async ({ client, assert }) => {
    const loggedInUser = await client
      .post('/login')
      .json({ email: goodUser.email, password: 'oasssadfasdf' })

    const response = await client.get('/tags/coo').bearerToken(loggedInUser.body().token)

    response.assertStatus(200)
    assert.isTrue(response.body().length >= 2)
    assert.equal(response.body()[0].name, 'Cooking')
  })

  test('Cannot get your tags', async ({ client, assert }) => {
    const loggedInUser = await client
      .post('/login')
      .json({ email: badUser.email, password: 'oasssadfasdf' })

    const response = await client.get('/tags/a').bearerToken(loggedInUser.body().token)

    response.assertStatus(200)
    assert.isTrue(response.body().length == 1)
    assert.equal(response.body()[0].name, 'Adonis-Is-Not-Cool')
  })

  test('403 on bad tag search', async ({ client }) => {
    const loggedInUser = await client
      .post('/login')
      .json({ email: goodUser.email, password: 'oasssadfasdf' })
    const response = await client
      .get('/tags/zzzzzzzzzzzzzzzznotatagzzzzzzz')
      .bearerToken(loggedInUser.body().token)

    response.assertStatus(204)

    const zeroResponse = await client.get('/tags/0').bearerToken(loggedInUser.body().token)

    zeroResponse.assertStatus(204)
  })

  test('Can update tag', async ({ client, assert }) => {
    const tag = await Tag.findByOrFail('name', 'Adonis-Update-Me')

    const updatedTag = { name: 'Adonis 102' }
    const loggedInUser = await client
      .post('/login')
      .json({ email: goodUser.email, password: 'oasssadfasdf' })
    const response = await client
      .put(`/tags/${tag.id}`)
      .bearerToken(loggedInUser.body().token)
      .json(updatedTag)
    response.assertStatus(200)
    assert.equal(response.body().message, 'Updated successfully')

    const findTag = await Tag.findOrFail(tag.id)
    assert.equal(findTag.name, 'Adonis-102')
    assert.equal(findTag.slug, 'adonis-102-' + goodUser.id)
    assert.notEqual(tag.slug, findTag.slug)
  })

  test('Cannot update tag with the same name of an existing tag', async ({ client, assert }) => {
    const tag = await Tag.findByOrFail('name', 'Adonis-Update-Me')

    const updatedTag = { name: 'cooking' }
    const loggedInUser = await client
      .post('/login')
      .json({ email: goodUser.email, password: 'oasssadfasdf' })
    const response = await client
      .put(`/tags/${tag.id}`)
      .bearerToken(loggedInUser.body().token)
      .json(updatedTag)

    response.assertStatus(400)
    console.log(response.body())
    assert.equal(
      response.body()[0].message,
      'Cannot update tag with the same name of an existing tag'
    )
  })

  test('Cannot update your tag', async ({ client, assert }) => {
    const tag = await TagFactory.merge({ user_id: goodUser.id }).create()

    const updatedTag = { name: 'adonis is so not cool' }
    const loggedInUser = await client
      .post('/login')
      .json({ email: badUser.email, password: 'oasssadfasdf' })
    const response = await client
      .put(`/tags/${tag.id}`)
      .bearerToken(loggedInUser.body().token)
      .json(updatedTag)
    response.assertStatus(403)
    assert.equal(
      response.body().message,
      'E_AUTHORIZATION_FAILURE: Not authorized to perform this action'
    )

    const findTag = await Tag.findOrFail(tag.id)
    assert.equal(findTag.name.toLowerCase(), tag.name)
  })

  test('Can delete my tag', async ({ client }) => {
    const loggedInUser = await client
      .post('/login')
      .json({ email: goodUser.email, password: 'oasssadfasdf' })
    const tag = await Tag.create({ name: 'Delete Meh', user_id: goodUser.id })

    const response = await client.delete(`/tags/${tag.id}`).bearerToken(loggedInUser.body().token)
    response.assertStatus(200)
    response.assertBodyContains({ message: `Deleted tag id: ${tag.id}` })
  })

  test('Cannot delete your tag', async ({ client }) => {
    const loggedInUser = await client
      .post('/login')
      .json({ email: badUser.email, password: 'oasssadfasdf' })
    const tag = await Tag.create({ name: 'Do Not Delete Meh', user_id: goodUser.id })

    const response = await client.delete(`/tags/${tag.id}`).bearerToken(loggedInUser.body().token)
    response.assertStatus(403)
    response.assertBodyContains({ message: 'You do not have permission to access this resource' })
  })

  test('Renaming a tag retains its illustrations', async ({ client, assert }) => {
    const loggedInUser = await client
      .post('/login')
      .json({ email: goodUser.email, password: 'oasssadfasdf' })

    // Create tag and illustrations
    const tag = await Tag.create({ name: 'Old-Tag-Name', user_id: goodUser.id })
    const illustration1 = await IllustrationFactory.merge({
      title: 'Illustration One',
      user_id: goodUser.id,
    }).create()
    const illustration2 = await IllustrationFactory.merge({
      title: 'Illustration Two',
      user_id: goodUser.id,
    }).create()

    // Attach illustrations to the tag
    await illustration1.related('tags').attach([tag.id])
    await illustration2.related('tags').attach([tag.id])

    // Rename the tag
    const updatedTagData = { name: 'New-Tag-Name' }
    const response = await client
      .put(`/tags/${tag.id}`)
      .bearerToken(loggedInUser.body().token)
      .json(updatedTagData)

    response.assertStatus(200)
    assert.equal(response.body().message, 'Updated successfully')

    // Fetch the updated tag and check if illustrations are still linked
    const updatedTag = await Tag.findByOrFail('name', 'New-Tag-Name')
    const relatedIllustrations = await updatedTag.related('illustrations').query()

    assert.equal(relatedIllustrations.length, 2)
    assert.isTrue(relatedIllustrations.some((ill) => ill.id === illustration1.id))
    assert.isTrue(relatedIllustrations.some((ill) => ill.id === illustration2.id))
  })
})
