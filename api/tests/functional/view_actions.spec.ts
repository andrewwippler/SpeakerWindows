import { test } from '@japa/runner'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import app from '@adonisjs/core/services/app'
import fs from 'node:fs/promises'
import db from '@adonisjs/lucid/services/db'
import UserFactory from '#database/factories/user_factory'
import IllustrationFactory from '#database/factories/illustration_factory'
import TagFactory from '#database/factories/tag_factory'
import PlaceFactory from '#database/factories/place_factory'
import TeamFactory from '#database/factories/team_factory'
import TeamMemberFactory from '#database/factories/team_member_factory'
import TeamMember from '#models/team_member'
import Illustration from '#models/illustration'
import Tag from '#models/tag'
import Place from '#models/place'
import Upload from '#models/upload'
import Setting from '#models/setting'
import type User from '#models/user'

const dirname = fileURLToPath(import.meta.url)
  .split('/')
  .slice(0, -1)
  .join('/')

test.group('View search', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('renders the search form', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const response = await client.get('/search').loginAs(user)

    response.assertStatus(200)
    response.assertTextIncludes('Enter a search term to find illustrations, tags, and places.')
    assert.include(response.text(), 'name="query"')
  })

  test('renders the form again for a blank query', async ({ client }) => {
    const user = await UserFactory.create()
    const response = await client.post('/search').loginAs(user).withCsrfToken().form({})

    response.assertStatus(200)
    response.assertTextIncludes('Enter a search term to find illustrations, tags, and places.')
  })

  test('finds illustrations and tags for the signed in user', async ({ client, assert }) => {
    const user = await UserFactory.create()
    await IllustrationFactory.merge({
      title: 'Searchview Story',
      content: 'Searchview content',
      user_id: user.id,
    }).create()
    await TagFactory.merge({ name: 'Searchview', user_id: user.id }).create()

    const response = await client
      .post('/search')
      .loginAs(user)
      .withCsrfToken()
      .form({ query: 'Searchview', limit: 10 })

    response.assertStatus(200)
    assert.include(response.text(), '<strong>Searchview</strong> Story')
    assert.include(response.text(), 'href="/tags/Searchview"')
  })
})

test.group('View illustration actions', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  group.each.teardown(async () => {
    await fs.rm(app.makePath('uploads', 'test'), { recursive: true, force: true })
  })

  test('rejects duplicate illustrations from the new form', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const payload = {
      title: 'Duplicate Story',
      author: 'Duplicate Author',
      source: 'https://example.com/duplicate',
      content: 'The same story content',
    }
    const first = await client.post('/illustrations').loginAs(user).withCsrfToken().form(payload)
    assert.match(first.redirects().join(','), /\/illustrations\/\d+/)

    const second = await client
      .post('/illustrations')
      .loginAs(user)
      .withCsrfToken()
      .header('referer', '/illustrations/new')
      .form(payload)
    second.assertRedirectsTo('/illustrations/new')
    const count = await Illustration.query().where('user_id', user.id).count('* as total').first()
    assert.equal(Number(count?.$extras.total), 1)
  })

  test('filters the illustration index by search and tag', async ({ client }) => {
    const user = await UserFactory.create()
    const illustration = await IllustrationFactory.merge({
      title: 'Filterable Story',
      user_id: user.id,
    }).create()
    const tag = await TagFactory.merge({ name: 'Filtertag', user_id: user.id }).create()
    await illustration.related('tags').attach([tag.id])

    const bySearch = await client.get('/illustrations').qs({ q: 'Filterable' }).loginAs(user)
    bySearch.assertStatus(200)
    bySearch.assertTextIncludes('Filterable Story')

    const byTag = await client.get('/illustrations').qs({ tag: 'Filtertag' }).loginAs(user)
    byTag.assertStatus(200)
    byTag.assertTextIncludes('Filterable Story')
  })

  test('rejects out of range illustration ids', async ({ client }) => {
    const user = await UserFactory.create()
    const show = await client.get('/illustrations/9999999999').loginAs(user)
    show.assertStatus(400)

    const edit = await client.get('/illustrations/9999999999/edit').loginAs(user)
    edit.assertStatus(400)
  })

  test('deletes an illustration and its tag associations', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const illustration = await IllustrationFactory.merge({ user_id: user.id }).create()
    const tag = await TagFactory.merge({ name: 'Deletetag', user_id: user.id }).create()
    await illustration.related('tags').attach([tag.id])

    const response = await client
      .delete(`/illustrations/${illustration.id}`)
      .loginAs(user)
      .withCsrfToken()

    response.assertRedirectsTo('/illustrations')
    assert.isNull(await Illustration.find(illustration.id))
  })

  test('does not allow another user to delete an illustration', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const otherUser = await UserFactory.create()
    const illustration = await IllustrationFactory.merge({
      user_id: user.id,
      private: false,
    }).create()

    const response = await client
      .delete(`/illustrations/${illustration.id}`)
      .loginAs(otherUser)
      .withCsrfToken()
      .header('referer', '/illustrations')

    response.assertRedirectsTo('/illustrations')
    assert.isNotNull(await Illustration.find(illustration.id))
  })

  test('adds and removes a place from the show page', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const illustration = await IllustrationFactory.merge({ user_id: user.id }).create()

    const created = await client
      .post(`/illustrations/${illustration.id}/places`)
      .loginAs(user)
      .withCsrfToken()
      .form({ place: 'View Observatory', location: 'Cincinnati', used: '2026-11-20' })
    created.assertRedirectsTo(`/illustrations/${illustration.id}`)

    const place = await Place.query().where('illustration_id', illustration.id).first()
    assert.isNotNull(place)

    const removed = await client
      .delete(`/illustrations/${illustration.id}/places/${place!.id}`)
      .loginAs(user)
      .withCsrfToken()
    removed.assertRedirectsTo(`/illustrations/${illustration.id}`)
    assert.isNull(await Place.find(place!.id))
  })

  test('does not allow another user to remove a place', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const otherUser = await UserFactory.create()
    const illustration = await IllustrationFactory.merge({ user_id: user.id }).create()
    const place = await PlaceFactory.merge({
      illustration_id: illustration.id,
      user_id: user.id,
    }).create()

    const response = await client
      .delete(`/illustrations/${illustration.id}/places/${place.id}`)
      .loginAs(otherUser)
      .withCsrfToken()

    response.assertRedirectsTo(`/illustrations/${illustration.id}`)
    assert.isNotNull(await Place.find(place.id))
  })

  test('uploads and deletes an attachment from the edit page', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const illustration = await IllustrationFactory.merge({ user_id: user.id }).create()
    const filePath = join(dirname, '..', 'assets', '1kb.png')

    const uploaded = await client
      .post(`/illustrations/${illustration.id}/upload`)
      .loginAs(user)
      .withCsrfToken()
      .file('illustration_image', filePath)
      .send()
    uploaded.assertRedirectsTo(`/illustrations/${illustration.id}/edit`)

    const upload = await Upload.query().where('illustration_id', illustration.id).first()
    assert.isNotNull(upload)

    const removed = await client
      .delete(`/illustrations/${illustration.id}/upload/${upload!.id}`)
      .loginAs(user)
      .withCsrfToken()
    removed.assertRedirectsTo(`/illustrations/${illustration.id}/edit`)
    assert.isNull(await Upload.find(upload!.id))
  })

  test('rejects uploads without a file', async ({ client }) => {
    const user = await UserFactory.create()
    const illustration = await IllustrationFactory.merge({ user_id: user.id }).create()

    const response = await client
      .post(`/illustrations/${illustration.id}/upload`)
      .loginAs(user)
      .withCsrfToken()
      .send()

    response.assertRedirectsTo(`/illustrations/${illustration.id}/edit`)
  })

  test('does not allow another user to upload a file', async ({ client }) => {
    const user = await UserFactory.create()
    const otherUser = await UserFactory.create()
    const illustration = await IllustrationFactory.merge({ user_id: user.id }).create()

    const response = await client
      .post(`/illustrations/${illustration.id}/upload`)
      .loginAs(otherUser)
      .withCsrfToken()
      .file('illustration_image', join(dirname, '..', 'assets', '1kb.png'))
      .send()

    response.assertRedirectsTo(`/illustrations/${illustration.id}`)
  })
})

test.group('View settings actions', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('saves the default place and location', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const response = await client
      .post('/settings')
      .loginAs(user)
      .withCsrfToken()
      .header('referer', '/settings')
      .form({ place: 'Library', location: 'Oxford' })

    response.assertRedirectsTo('/settings')
    const settings = await Setting.query().where('user_id', user.id).first()
    assert.equal(settings?.place, 'Library')
    assert.equal(settings?.location, 'Oxford')
  })

  test('rejects invalid team member details', async ({ client }) => {
    const user = await UserFactory.create()
    const team = await TeamFactory.merge({ userId: user.id }).create()
    await TeamMemberFactory.merge({
      teamId: team.id,
      userId: user.id,
      role: 'owner',
    }).create()

    const response = await client
      .post('/settings/team/members')
      .loginAs(user)
      .withCsrfToken()
      .header('referer', '/settings')
      .form({ email: 'not-an-email', role: 'editor' })

    response.assertRedirectsTo('/settings')
  })

  test('rejects adding yourself or an existing member', async ({ client }) => {
    const user = await UserFactory.create()
    const member = await UserFactory.create()
    const team = await TeamFactory.merge({ userId: user.id }).create()
    await TeamMemberFactory.merge({
      teamId: team.id,
      userId: user.id,
      role: 'owner',
    }).create()
    await TeamMemberFactory.merge({
      teamId: team.id,
      userId: member.id,
      role: 'editor',
    }).create()

    for (const email of [user.email, member.email]) {
      const response = await client
        .post('/settings/team/members')
        .loginAs(user)
        .withCsrfToken()
        .header('referer', '/settings')
        .form({ email, role: 'editor' })
      response.assertRedirectsTo('/settings')
    }
  })

  test('updates and removes a team member', async ({ client, assert }) => {
    const owner: User = await UserFactory.create()
    const member: User = await UserFactory.create()
    const team = await TeamFactory.merge({ userId: owner.id }).create()
    await TeamMemberFactory.merge({
      teamId: team.id,
      userId: owner.id,
      role: 'owner',
    }).create()
    const membership = await TeamMemberFactory.merge({
      teamId: team.id,
      userId: member.id,
      role: 'editor',
    }).create()

    const updated = await client
      .post(`/settings/team/members/${member.id}`)
      .loginAs(owner)
      .withCsrfToken()
      .header('referer', '/settings')
      .form({ role: 'readonly' })
    updated.assertRedirectsTo('/settings')
    await membership.refresh()
    assert.equal(membership.role, 'readonly')

    const removed = await client
      .post(`/settings/team/members/${member.id}/remove`)
      .loginAs(owner)
      .withCsrfToken()
      .header('referer', '/settings')
    removed.assertRedirectsTo('/settings')
    assert.isNull(await TeamMember.find(membership.id))
  })

  test('protects the owner role and missing members', async ({ client }) => {
    const owner: User = await UserFactory.create()
    const stranger: User = await UserFactory.create()
    const team = await TeamFactory.merge({ userId: owner.id }).create()
    await TeamMemberFactory.merge({
      teamId: team.id,
      userId: owner.id,
      role: 'owner',
    }).create()

    for (const userId of [owner.id, stranger.id]) {
      const update = await client
        .post(`/settings/team/members/${userId}`)
        .loginAs(owner)
        .withCsrfToken()
        .header('referer', '/settings')
        .form({ role: 'editor' })
      update.assertRedirectsTo('/settings')

      const remove = await client
        .post(`/settings/team/members/${userId}/remove`)
        .loginAs(owner)
        .withCsrfToken()
        .header('referer', '/settings')
      remove.assertRedirectsTo('/settings')
    }
  })

  test('rotates the API key', async ({ client }) => {
    const user = await UserFactory.create()
    const response = await client
      .post('/settings/api-key/rotate')
      .loginAs(user)
      .withCsrfToken()
      .header('referer', '/settings')

    response.assertRedirectsTo('/settings')
  })

  test('reports an invalid import type', async ({ client }) => {
    const user = await UserFactory.create()
    const response = await client
      .post('/settings/import')
      .loginAs(user)
      .withCsrfToken()
      .header('referer', '/settings')
      .form({ importer: 'unknown' })

    response.assertRedirectsTo('/settings')
  })
})

test.group('View tag actions', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('renames and deletes a tag', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const tag = await TagFactory.merge({ name: 'Renametag', user_id: user.id }).create()

    const renamed = await client
      .post(`/tags/${tag.id}`)
      .loginAs(user)
      .withCsrfToken()
      .form({ name: 'Newtag' })
    renamed.assertRedirectsTo('/tags/Newtag')
    const renamedTag = await Tag.find(tag.id)
    assert.equal(renamedTag?.name, 'Newtag')

    const deleted = await client.post(`/tags/${tag.id}/delete`).loginAs(user).withCsrfToken()
    deleted.assertRedirectsTo('/tags')
    assert.isNull(await Tag.find(tag.id))
  })

  test('rejects an empty tag name and tags owned by other users', async ({ client }) => {
    const user = await UserFactory.create()
    const otherUser = await UserFactory.create()
    const tag = await TagFactory.merge({ name: 'Ownedtag', user_id: user.id }).create()

    const empty = await client
      .post(`/tags/${tag.id}`)
      .loginAs(user)
      .withCsrfToken()
      .header('referer', '/tags')
      .form({})
    empty.assertRedirectsTo('/tags')

    const notOwned = await client
      .post(`/tags/${tag.id}`)
      .loginAs(otherUser)
      .withCsrfToken()
      .form({ name: 'Stolentag' })
    notOwned.assertRedirectsTo('/tags')

    const deleteNotOwned = await client
      .post(`/tags/${tag.id}/delete`)
      .loginAs(otherUser)
      .withCsrfToken()
    deleteNotOwned.assertRedirectsTo('/tags')
  })

  test('bulk removes illustrations from a tag', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const tag = await TagFactory.merge({ name: 'Bulktag', user_id: user.id }).create()
    const illustration = await IllustrationFactory.merge({ user_id: user.id }).create()
    await illustration.related('tags').attach([tag.id])

    const response = await client
      .post('/tags/Bulktag/bulk')
      .loginAs(user)
      .withCsrfToken()
      .form({ action: 'remove_tag', ids: [illustration.id] })

    response.assertRedirectsTo('/tags/Bulktag')
    const remainingTags = await illustration.related('tags').query()
    assert.equal(remainingTags.length, 0)
  })

  test('bulk toggles illustration privacy', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const tag = await TagFactory.merge({ name: 'Privacytag', user_id: user.id }).create()
    const illustration = await IllustrationFactory.merge({
      user_id: user.id,
      private: false,
    }).create()
    await illustration.related('tags').attach([tag.id])

    const response = await client
      .post(`/tags/${encodeURIComponent(tag.name)}/bulk`)
      .loginAs(user)
      .withCsrfToken()
      .form({ action: 'toggle_privacy', ids: illustration.id, private: 'true' })

    response.assertRedirectsTo(`/tags/${tag.name}`)
    await illustration.refresh()
    assert.isTrue(illustration.private)
  })

  test('renders recently viewed illustrations on the articles page', async ({ client }) => {
    const user = await UserFactory.create()
    const illustration = await IllustrationFactory.merge({ user_id: user.id }).create()

    await client.get(`/illustrations/${illustration.id}`).loginAs(user)
    const response = await client.get('/articles').loginAs(user)

    response.assertStatus(200)
  })
})
