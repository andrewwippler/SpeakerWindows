import { test } from '@japa/runner'
import UserFactory from '#database/factories/UserFactory'
import Tag from '#models/tag'
import TagFactory from '#database/factories/TagFactory'
import IllustrationFactory from '#database/factories/IllustrationFactory'
import TeamFactory from '#database/factories/TeamFactory'
import TeamMemberFactory from '#database/factories/TeamMemberFactory'
import db from '@adonisjs/lucid/services/db'
import Team from '#models/team'
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

  test('Can get list of my tags (i.e. index page)', async ({ client, assert }) => {
    const user = await UserFactory.make()
    const fixedUser = {
      email: user.email,
      password: user.password + '1A!a',
      password_confirmation: user.password + '1A!a',
    }

    await client.post('/register').json(fixedUser)
    const loginResponse = await client.post('/login').json({
      email: user.email,
      password: user.password + '1A!a',
    })

    const body = loginResponse.body()

    const team = await Team.query().where('user_id', body.id).first()

    const illustration = await IllustrationFactory.merge({
      title: 'Testing tag selection',
      user_id: body.id,
      team_id: team?.id ?? null,
    }).create()
    const illustration2 = await IllustrationFactory.merge({
      title: 'Testing tag selection2',
      user_id: body.id,
      team_id: team?.id ?? null,
    }).create()

    const tags = await TagFactory.merge({ name: 'Searching', user_id: body.id, team_id: team?.id ?? null }).create()
    const tags2 = await TagFactory.merge({ name: 'Searching2', user_id: body.id, team_id: team?.id ?? null }).create()
    await illustration.related('tags').attach([tags.id])
    await illustration2.related('tags').attach([tags2.id])

    const response = await client.get('/tags').qs({ team_id: team?.id }).bearerToken(body.token)

    response.assertStatus(200)
    assert.isTrue(response.body().length >= 2)

    const responseTwo = await client.get('/tags').qs({ team_id: null }).bearerToken(body.token)

    responseTwo.assertStatus(200)
    assert.isTrue(responseTwo.body().length == 0)
  })

  test('Can get list of my illustrations (i.e. tag index page)', async ({ client, assert }) => {
    const user = await UserFactory.make()
    const fixedUser = {
      email: user.email,
      password: user.password + '1A!a',
      password_confirmation: user.password + '1A!a',
    }

    await client.post('/register').json(fixedUser)
    const loginResponse = await client.post('/login').json({
      email: user.email,
      password: user.password + '1A!a',
    })

    const body = loginResponse.body()
    const team = await Team.query().where('user_id', body.id).first()

    const illustration = await IllustrationFactory.merge({
      title: 'Testing tag selection',
      user_id: body.id,
      team_id: team?.id ?? null,
    }).create()
    const illustration2 = await IllustrationFactory.merge({
      title: 'Testing tag selection2',
      user_id: body.id,
      team_id: team?.id ?? null,
    }).create()

    const tags = await TagFactory.merge({ name: 'Searching', user_id: body.id, team_id: team?.id ?? null }).create()
    const tags2 = await TagFactory.merge({ name: 'Searching2', user_id: body.id, team_id: team?.id ?? null }).create()
    await illustration.related('tags').attach([tags.id])
    await illustration2.related('tags').attach([tags2.id])


    const response = await client.get(`/tag/Searching`).qs({ team_id: team?.id }).bearerToken(body.token)

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
    // console.log(response.body())
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

  test('Can remove illustrations from my tag', async ({ client, assert }) => {
    const loggedInUser = await client
      .post('/login')
      .json({ email: goodUser.email, password: 'oasssadfasdf' })

    const tag = await Tag.create({ name: 'Remove-Test-Tag', user_id: goodUser.id })
    const illustration1 = await IllustrationFactory.merge({
      title: 'Illustration to Remove 1',
      user_id: goodUser.id,
    }).create()
    const illustration2 = await IllustrationFactory.merge({
      title: 'Illustration to Remove 2',
      user_id: goodUser.id,
    }).create()

    await illustration1.related('tags').attach([tag.id])
    await illustration2.related('tags').attach([tag.id])

    const response = await client
      .delete(`/tags/${tag.id}/illustrations`)
      .bearerToken(loggedInUser.body().token)
      .json({ illustration_ids: [illustration1.id, illustration2.id] })

    response.assertStatus(200)
    response.assertBodyContains({ message: 'Removed 2 illustrations from tag' })

    const updatedTag = await Tag.findOrFail(tag.id)
    const relatedIllustrations = await updatedTag.related('illustrations').query()
    assert.equal(relatedIllustrations.length, 0)
  })

  test('Cannot remove illustrations from tag without auth', async ({ client }) => {
    const tag = await Tag.create({ name: 'No-Auth-Tag', user_id: goodUser.id })
    const illustration = await IllustrationFactory.merge({
      title: 'Test Illustration',
      user_id: goodUser.id,
    }).create()
    await illustration.related('tags').attach([tag.id])

    const response = await client
      .delete(`/tags/${tag.id}/illustrations`)
      .json({ illustration_ids: [illustration.id] })

    response.assertStatus(401)
  })

  test('Cannot remove illustrations from another users tag', async ({ client }) => {
    const loggedInUser = await client
      .post('/login')
      .json({ email: badUser.email, password: 'oasssadfasdf' })

    const tag = await Tag.create({ name: 'Other-User-Tag', user_id: goodUser.id })
    const illustration = await IllustrationFactory.merge({
      title: 'Other User Illustration',
      user_id: goodUser.id,
    }).create()
    await illustration.related('tags').attach([tag.id])

    const response = await client
      .delete(`/tags/${tag.id}/illustrations`)
      .bearerToken(loggedInUser.body().token)
      .json({ illustration_ids: [illustration.id] })

    response.assertStatus(403)
    response.assertBodyContains({ message: 'You do not have permission to access this resource' })
  })
})

test.group('Tag - Team Scoped', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('Tags created before joining team become team tags after join', async ({ client, assert }) => {
    const userA = await UserFactory.merge({ password: 'oasssadfasdf' }).create()
    const userB = await UserFactory.merge({ password: 'oasssadfasdf' }).create()

    const loginA = await client.post('/login').json({ email: userA.email, password: 'oasssadfasdf' })
    loginA.assertStatus(200)
    const tokenA = loginA.body().token

    const loginB = await client.post('/login').json({ email: userB.email, password: 'oasssadfasdf' })
    loginB.assertStatus(200)
    const tokenB = loginB.body().token

    const teamB = await TeamFactory.merge({ userId: userB.id }).create()

    const illustration = await IllustrationFactory.merge({
      title: 'Test Illustration',
      user_id: userA.id,
    }).create()

    const tags = []
    for (let i = 1; i <= 5; i++) {
      const tag = await Tag.create({
        name: `Tag-${i}`,
        user_id: userA.id,
        team_id: null,
      })
      tags.push(tag)
      await illustration.related('tags').attach([tag.id])
    }

    const personalTagsResponse = await client.get('/tags').bearerToken(tokenA)
    personalTagsResponse.assertStatus(200)
    assert.equal(personalTagsResponse.body().length, 5)

    const joinResponse = await client.post(`/teams/join/${teamB.inviteCode}`).bearerToken(tokenA)
    joinResponse.assertStatus(200)
    assert.equal(joinResponse.body().message, 'Joined team successfully')

    const teamTagsResponse = await client.get(`/tags`).qs({ team_id: teamB.id }).bearerToken(tokenA)
    assert.equal(teamTagsResponse.body().length, 5)

    for (const tag of teamTagsResponse.body()) {
      assert.isTrue(tag.slug.includes(`-team-${teamB.id}`))
    }

    const newPersonalTagsResponse = await client.get('/tags').bearerToken(tokenA)
    // filtering out any team tags to verify all were moved to team and none remain personal
    assert.equal(newPersonalTagsResponse.body().filter(tag => tag.teamId !== teamB.id).length, 0)
  })

  test('When joining team, personal tags with same name as team tags are merged', async ({ client, assert }) => {
    const userA = await UserFactory.merge({ password: 'oasssadfasdf' }).create()
    const userB = await UserFactory.merge({ password: 'oasssadfasdf' }).create()

    const loginA = await client.post('/login').json({ email: userA.email, password: 'oasssadfasdf' })
    const tokenA = loginA.body().token

    const loginB = await client.post('/login').json({ email: userB.email, password: 'oasssadfasdf' })
    const tokenB = loginB.body().token

    const teamB = await TeamFactory.merge({ userId: userB.id }).create()

    const illA = await IllustrationFactory.merge({
      title: 'UserA Illustration',
      user_id: userA.id,
    }).create()

    const personalReact = await Tag.create({
      name: 'React',
      user_id: userA.id,
      team_id: null,
    })
    await illA.related('tags').attach([personalReact.id])

    const teamReact = await Tag.create({
      name: 'React',
      user_id: userB.id,
      team_id: teamB.id,
    })

    const joinResponse = await client.post(`/teams/join/${teamB.inviteCode}`).bearerToken(tokenA)
    assert.equal(joinResponse.body().message, 'Joined team successfully')

    const teamTagsResponse = await client.get(`/tags`).qs({ team_id: teamB.id }).bearerToken(tokenA)
    assert.equal(teamTagsResponse.body().length, 1)
    assert.equal(teamTagsResponse.body()[0].name, 'React')

    const personalReactExists = await Tag.find(personalReact.id)
    assert.isNull(personalReactExists)

    const illTags = await illA.related('tags').query()
    assert.equal(illTags.length, 1)
    assert.equal(illTags[0].id, teamReact.id)
  })

  test('When user leaves team, team tags become personal tags', async ({ client, assert }) => {
    const userA = await UserFactory.merge({ password: 'oasssadfasdf' }).create()
    const userB = await UserFactory.merge({ password: 'oasssadfasdf' }).create()

    const loginA = await client.post('/login').json({ email: userA.email, password: 'oasssadfasdf' })
    const tokenA = loginA.body().token

    const loginB = await client.post('/login').json({ email: userB.email, password: 'oasssadfasdf' })
    const tokenB = loginB.body().token

    const teamB = await TeamFactory.merge({ userId: userB.id }).create()

    const ownerTag = await Tag.create({ name: 'Owner-Tag', user_id: userB.id, team_id: teamB.id })

    const alphaTag = await Tag.create({ name: 'Alpha', user_id: userA.id, team_id: null })
    const betaTag = await Tag.create({ name: 'Beta', user_id: userA.id, team_id: null })

    const joinResponse = await client.post(`/teams/join/${teamB.inviteCode}`).bearerToken(tokenA)
    assert.equal(joinResponse.body().message, 'Joined team successfully')

    const afterJoinPersonal = await client.get('/tags').bearerToken(tokenA)
    assert.equal(afterJoinPersonal.body().filter(tag => tag.teamId !== teamB.id).length, 0)

    const afterJoinTeam = await client.get(`/tags`).qs({team_id: teamB.id}).bearerToken(tokenA)
    assert.equal(afterJoinTeam.body().length, 3)

    const leaveResponse = await client.delete(`/team/memberships/${teamB.id}`).bearerToken(tokenA)
    assert.equal(leaveResponse.body().message, 'Left team successfully')

    const afterLeavePersonal = await client.get('/tags').bearerToken(tokenA)
    assert.equal(afterLeavePersonal.body().length, 2)
    const names = afterLeavePersonal.body().map((t: any) => t.name).sort()
    assert.deepEqual(names, ['Alpha', 'Beta'])

    const ownerAfterLeave = await client.get(`/tags`).qs({team_id: teamB.id}).bearerToken(tokenB)
    assert.equal(ownerAfterLeave.body().length, 3)
    const ownerTagNames = ownerAfterLeave.body().map((t: any) => t.name).sort()
    assert.deepEqual(ownerTagNames, ['Alpha', 'Beta', 'Owner-Tag'])

    const illustration = await IllustrationFactory.merge({
      title: 'New Personal Illustration',
      user_id: userA.id,
    }).create()
    const gammaTag = await Tag.create({ name: 'Gamma', user_id: userA.id, team_id: null })
    await illustration.related('tags').attach([gammaTag.id])

    const afterNewTagPersonal = await client.get('/tags').bearerToken(tokenA)
    assert.equal(afterNewTagPersonal.body().length, 3)
    const allNames = afterNewTagPersonal.body().map((t: any) => t.name).sort()
    assert.deepEqual(allNames, ['Alpha', 'Beta', 'Gamma'])

    const userAlpha = afterNewTagPersonal.body().find((t: any) => t.name === 'Alpha')
    const deleteResponse = await client.delete(`/tags/${userAlpha.id}`).bearerToken(tokenA)
    assert.equal(deleteResponse.body().message, `Deleted tag id: ${userAlpha.id}`)

    const userAfterDelete = await client.get('/tags').bearerToken(tokenA)
    assert.equal(userAfterDelete.body().length, 2)
    const userTagNames = userAfterDelete.body().map((t: any) => t.name).sort()
    assert.deepEqual(userTagNames, ['Beta', 'Gamma'])

    const ownerStillHasAlpha = await client.get(`/tags?team_id=${teamB.id}`).bearerToken(tokenB)
    assert.equal(ownerStillHasAlpha.body().length, 3)
    const ownerTagNamesAfterDelete = ownerStillHasAlpha.body().map((t: any) => t.name).sort()
    assert.deepEqual(ownerTagNamesAfterDelete, ['Alpha', 'Beta', 'Owner-Tag'])
  })
})
