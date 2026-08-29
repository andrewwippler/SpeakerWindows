import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import UserFactory from '#database/factories/user_factory'
import TeamFactory from '#database/factories/team_factory'
import TeamMemberFactory from '#database/factories/team_member_factory'
import IllustrationFactory from '#database/factories/illustration_factory'
import PlaceFactory from '#database/factories/place_factory'
import TagFactory from '#database/factories/tag_factory'
import Place from '#models/place'

test.group('Illustration show view', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('renders metadata, content, copy button and places for the owner', async ({
    client,
    assert,
  }) => {
    const user = await UserFactory.create()
    const illustration = await IllustrationFactory.merge({
      title: 'Owner Show Story',
      author: 'Owner Author',
      source: 'https://example.com/owner',
      content: 'The owner story content.',
      user_id: user.id,
      private: false,
    }).create()
    await PlaceFactory.merge({
      illustration_id: illustration.id,
      user_id: user.id,
      place: 'Queen City',
      location: 'Cincy',
    }).create()
    const tag = await TagFactory.merge({ name: 'Action-Story', user_id: user.id }).create()
    const tag2 = await TagFactory.merge({ name: 'Second-Tag', user_id: user.id }).create()
    await illustration.related('tags').attach([tag.id, tag2.id])

    const response = await client.get(`/illustrations/${illustration.id}`).loginAs(user)

    response.assertStatus(200)
    response.assertTextIncludes('Owner Show Story')
    response.assertTextIncludes('Owner Author')
    response.assertTextIncludes('https://example.com/owner')
    response.assertTextIncludes('The owner story content.')
    response.assertTextIncludes('Copy Illustration Content')
    response.assertTextIncludes('Illustration Use')
    response.assertTextIncludes('Add a place')
    assert.include(response.text(), 'class="group"')
    assert.include(response.text(), 'name="used"')
    response.assertTextIncludes('Queen City')
    response.assertTextIncludes('Action Story')
    response.assertTextIncludes('href="/tags/Action-Story"')
    response.assertTextIncludes('Second Tag')
    assert.match(
      response.text(),
      /(Action Story<\/a>\s*,\s*<a href="\/tags\/Second-Tag"|Second Tag<\/a>\s*,\s*<a href="\/tags\/Action-Story")/
    )
    response.assertTextIncludes('Edit Illustration')
    response.assertTextIncludes('Delete Illustration')
    assert.notInclude(response.text(), '<ot-tag')
    assert.notInclude(response.text(), 'As an Editor')
    assert.notInclude(response.text(), 'As a Read-Only member')
  })

  test('team editor sees editor banner and no copy button', async ({ client, assert }) => {
    const owner = await UserFactory.create()
    const team = await TeamFactory.merge({ userId: owner.id }).create()
    const editor = await UserFactory.create()
    await TeamMemberFactory.merge({
      teamId: team.id,
      userId: editor.id,
      role: 'editor',
    }).create()

    const illustration = await IllustrationFactory.merge({
      title: 'Team Editor Story',
      content: 'Team content for editor.',
      user_id: owner.id,
      team_id: team.id,
      private: false,
    }).create()

    const response = await client.get(`/illustrations/${illustration.id}`).loginAs(editor)

    response.assertStatus(200)
    response.assertTextIncludes('Team Editor Story')
    response.assertTextIncludes('As an Editor, you can only edit metadata')
    assert.notInclude(response.text(), 'Copy Illustration Content')
    response.assertTextIncludes('Edit Illustration')
  })

  test('team readonly member sees readonly banner, no copy and no edit', async ({
    client,
    assert,
  }) => {
    const owner = await UserFactory.create()
    const team = await TeamFactory.merge({ userId: owner.id }).create()
    const readonly = await UserFactory.create()
    await TeamMemberFactory.merge({
      teamId: team.id,
      userId: readonly.id,
      role: 'readonly',
    }).create()

    const illustration = await IllustrationFactory.merge({
      title: 'Team Readonly Story',
      content: 'Team content for readonly.',
      user_id: owner.id,
      team_id: team.id,
      private: false,
    }).create()

    const response = await client.get(`/illustrations/${illustration.id}`).loginAs(readonly)

    response.assertStatus(200)
    response.assertTextIncludes('Team Readonly Story')
    response.assertTextIncludes('As a Read-Only member')
    assert.notInclude(response.text(), 'Copy Illustration Content')
    assert.notInclude(response.text(), '/illustrations/' + illustration.id + '/edit')
  })

  test('copy button form creates a place for the illustration', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const illustration = await IllustrationFactory.merge({
      title: 'Copy Button Story',
      content: 'Copy me please.',
      user_id: user.id,
      private: false,
    }).create()

    const response = await client
      .post(`/illustrations/${illustration.id}/places`)
      .loginAs(user)
      .withCsrfToken()
      .form({
        place: 'Home Base',
        location: 'Cincinnati',
        used: '2026-08-29',
      })

    response.assertRedirectsTo(`/illustrations/${illustration.id}`)

    const places = await Place.query().where('illustration_id', illustration.id)
    assert.equal(places.length, 1)
    assert.equal(places[0].place, 'Home Base')
    assert.equal(places[0].location, 'Cincinnati')
  })

  test('copy button ajax post returns json and creates a place', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const illustration = await IllustrationFactory.merge({
      title: 'Copy Ajax Story',
      content: 'Copy me via ajax.',
      user_id: user.id,
      private: false,
    }).create()

    const response = await client
      .post(`/illustrations/${illustration.id}/places`)
      .loginAs(user)
      .withCsrfToken()
      .header('X-Requested-With', 'XMLHttpRequest')
      .form({
        place: 'Study Room',
        location: 'Cambridge',
        used: '2026-08-29',
      })

    response.assertStatus(201)
    response.assertBodyContains({ message: 'Illustration copied.' })
    assert.isNumber(response.body().place.id)
    assert.equal(response.body().place.place, 'Study Room')
    assert.equal(response.body().place.location, 'Cambridge')
    assert.equal(response.body().place.used, '2026-08-29')

    const places = await Place.query().where('illustration_id', illustration.id)
    assert.equal(places.length, 1)
    assert.equal(places[0].place, 'Study Room')
    assert.equal(places[0].location, 'Cambridge')
  })
})
