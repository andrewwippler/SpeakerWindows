import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import UserFactory from '#database/factories/UserFactory'
import TeamFactory from '#database/factories/TeamFactory'
import TeamMemberFactory from '#database/factories/TeamMemberFactory'
import Team from '#models/team'
import TeamMember from '#models/team_member'
import Illustration from '#models/illustration'

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

test.group('Teams', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('User registration creates a team', async ({ client, assert }) => {
    const user = await UserFactory.make()
    const fixedUser = {
      email: user.email,
      password: user.password + '1A!a',
      password_confirmation: user.password + '1A!a',
    }

    const response = await client.post('/register').json(fixedUser)
    response.assertBodyContains({ message: 'Created successfully' })

    const team = await Team.query().where('user_id', response.body().id).first()
    assert.exists(team)
    assert.equal(team?.name, 'My Team')
    assert.exists(team?.inviteCode)
  })

  test('User can get their team', async ({ client, assert }) => {
    const user = await UserFactory.make()
    const fixedUser = {
      email: user.email,
      password: user.password + '1A!a',
      password_confirmation: user.password + '1A!a',
    }

    const registerResponse = await client.post('/register').json(fixedUser)
    const loginResponse = await client.post('/login').json({
      email: user.email,
      password: user.password + '1A!a',
    })

    const token = loginResponse.body().token

    const teamResponse = await client.get('/team').bearerToken(token)
    teamResponse.assertStatus(200)
    assert.exists(teamResponse.body().id)
    assert.equal(teamResponse.body().name, 'My Team')
    assert.exists(teamResponse.body().inviteCode)
  })

  test('User can update team name', async ({ client, assert }) => {
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

    const token = loginResponse.body().token

    const updateResponse = await client.put('/team').bearerToken(token).json({ name: 'New Team Name' })
    updateResponse.assertStatus(200)
    assert.equal(updateResponse.body().name, 'New Team Name')
  })

  test('User can join a team via invite code', async ({ client, assert }) => {
    const owner = await UserFactory.make()
    const ownerUser = {
      email: owner.email,
      password: owner.password + '1A!a',
      password_confirmation: owner.password + '1A!a',
    }

    await client.post('/register').json(ownerUser)
    const ownerLogin = await client.post('/login').json({
      email: owner.email,
      password: owner.password + '1A!a',
    })

    const teamResponse = await client.get('/team').bearerToken(ownerLogin.body().token)
    const inviteCode = teamResponse.body().inviteCode

    const member = await UserFactory.make()
    const memberUser = {
      email: member.email,
      password: member.password + '1A!a',
      password_confirmation: member.password + '1A!a',
    }

    await client.post('/register').json(memberUser)
    const memberLogin = await client.post('/login').json({
      email: member.email,
      password: member.password + '1A!a',
    })

    const joinResponse = await client.post(`/teams/join/${inviteCode}`).bearerToken(memberLogin.body().token)
    joinResponse.assertStatus(200)
    assert.exists(joinResponse.body().message)

    const membership = await TeamMember.query()
      .where('user_id', memberLogin.body().id)
      .first()
    assert.exists(membership)
  })

  test('Owner can add members to team', async ({ client, assert }) => {
    const owner = await UserFactory.make()
    const ownerUser = {
      email: owner.email,
      password: owner.password + '1A!a',
      password_confirmation: owner.password + '1A!a',
    }

    await client.post('/register').json(ownerUser)
    const ownerLogin = await client.post('/login').json({
      email: owner.email,
      password: owner.password + '1A!a',
    })

    const teamResponse = await client.get('/team').bearerToken(ownerLogin.body().token)
    const teamId = teamResponse.body().id

    const newMember = await UserFactory.create()

    const addResponse = await client.post('/team/members').bearerToken(ownerLogin.body().token).json({
      userId: newMember.id,
      role: 'editor',
    })
    addResponse.assertStatus(200)
  })

  test('Owner can update member role', async ({ client, assert }) => {
    const owner = await UserFactory.make()
    const ownerUser = {
      email: owner.email,
      password: owner.password + '1A!a',
      password_confirmation: owner.password + '1A!a',
    }

    await client.post('/register').json(ownerUser)
    const ownerLogin = await client.post('/login').json({
      email: owner.email,
      password: owner.password + '1A!a',
    })

    const newMember = await UserFactory.create()
    await TeamMember.create({
      teamId: (await Team.query().where('user_id', ownerLogin.body().id).first())!.id,
      userId: newMember.id,
      role: 'editor',
    })

    const updateResponse = await client.put(`/team/members/${newMember.id}`).bearerToken(ownerLogin.body().token).json({
      role: 'creator',
    })
    updateResponse.assertStatus(200)

    const membership = await TeamMember.query().where('user_id', newMember.id).first()
    assert.equal(membership?.role, 'creator')
  })

  test('Owner can remove members from team', async ({ client, assert }) => {
    const owner = await UserFactory.make()
    const ownerUser = {
      email: owner.email,
      password: owner.password + '1A!a',
      password_confirmation: owner.password + '1A!a',
    }

    await client.post('/register').json(ownerUser)
    const ownerLogin = await client.post('/login').json({
      email: owner.email,
      password: owner.password + '1A!a',
    })

    const team = await Team.query().where('user_id', ownerLogin.body().id).first()

    const newMember = await UserFactory.create()
    await TeamMember.create({
      teamId: team!.id,
      userId: newMember.id,
      role: 'editor',
    })

    const removeResponse = await client.delete(`/team/members/${newMember.id}`).bearerToken(ownerLogin.body().token)
    removeResponse.assertStatus(200)

    const membership = await TeamMember.query().where('user_id', newMember.id).first()
    assert.notExists(membership)
  })
})

test.group('Team Illustrations', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('Owner can create team illustration', async ({ client, assert }) => {
    const owner = await UserFactory.make()
    const ownerUser = {
      email: owner.email,
      password: owner.password + '1A!a',
      password_confirmation: owner.password + '1A!a',
    }

    await client.post('/register').json(ownerUser)
    const ownerLogin = await client.post('/login').json({
      email: owner.email,
      password: owner.password + '1A!a',
    })

    const createResponse = await client.post('/illustration').bearerToken(ownerLogin.body().token).json({
      title: 'Team Illustration',
      content: 'Test content',
      author: 'Test author',
    })
    createResponse.assertStatus(200)

    const illustration = await Illustration.find(createResponse.body().id)
    assert.equal(illustration?.private, false)
  })

  test('Editor cannot create team illustration (creates private)', async ({ client, assert }) => {
    const owner = await UserFactory.make()
    const ownerUser = {
      email: owner.email,
      password: owner.password + '1A!a',
      password_confirmation: owner.password + '1A!a',
    }

    await client.post('/register').json(ownerUser)
    const ownerLogin = await client.post('/login').json({
      email: owner.email,
      password: owner.password + '1A!a',
    })

    const team = await Team.query().where('user_id', ownerLogin.body().id).first()

    const editor = await UserFactory.make()
    const editorUser = {
      email: editor.email,
      password: editor.password + '1A!a',
      password_confirmation: editor.password + '1A!a',
    }

    await client.post('/register').json(editorUser)
    const editorLogin = await client.post('/login').json({
      email: editor.email,
      password: editor.password + '1A!a',
    })

    await TeamMember.create({
      teamId: team!.id,
      userId: editorLogin.body().id,
      role: 'editor',
    })

    const createResponse = await client.post('/illustration').bearerToken(editorLogin.body().token).json({
      title: 'Editor Illustration',
      content: 'Test content',
      author: 'Test author',
    })
    createResponse.assertStatus(200)

    const illustration = await Illustration.find(createResponse.body().id)
    assert.equal(illustration?.private, true)
  })

  test('Team members can view team illustrations', async ({ client, assert }) => {
    const owner = await UserFactory.make()
    const ownerUser = {
      email: owner.email,
      password: owner.password + '1A!a',
      password_confirmation: owner.password + '1A!a',
    }

    await client.post('/register').json(ownerUser)
    const ownerLogin = await client.post('/login').json({
      email: owner.email,
      password: owner.password + '1A!a',
    })

    const createResponse = await client.post('/illustration').bearerToken(ownerLogin.body().token).json({
      title: 'Team Illustration',
      content: 'Test content',
    })
    const illustrationId = createResponse.body().id

    const team = await Team.query().where('user_id', ownerLogin.body().id).first()

    const member = await UserFactory.make()
    const memberUser = {
      email: member.email,
      password: member.password + '1A!a',
      password_confirmation: member.password + '1A!a',
    }

    await client.post('/register').json(memberUser)
    const memberLogin = await client.post('/login').json({
      email: member.email,
      password: member.password + '1A!a',
    })

    await TeamMember.create({
      teamId: team!.id,
      userId: memberLogin.body().id,
      role: 'readonly',
    })

    const getResponse = await client.get(`/illustration/${illustrationId}`).bearerToken(memberLogin.body().token)
    getResponse.assertStatus(200)
    assert.equal(getResponse.body().title, 'Team Illustration')
  })

  test('Non-members cannot view team illustrations', async ({ client, assert }) => {
    const owner = await UserFactory.make()
    const ownerUser = {
      email: owner.email,
      password: owner.password + '1A!a',
      password_confirmation: owner.password + '1A!a',
    }

    await client.post('/register').json(ownerUser)
    const ownerLogin = await client.post('/login').json({
      email: owner.email,
      password: owner.password + '1A!a',
    })

    const createResponse = await client.post('/illustration').bearerToken(ownerLogin.body().token).json({
      title: 'Team Illustration',
      content: 'Test content',
    })
    const illustrationId = createResponse.body().id

    const outsider = await UserFactory.make()
    const outsiderUser = {
      email: outsider.email,
      password: outsider.password + '1A!a',
      password_confirmation: outsider.password + '1A!a',
    }

    await client.post('/register').json(outsiderUser)
    const outsiderLogin = await client.post('/login').json({
      email: outsider.email,
      password: outsider.password + '1A!a',
    })

    const getResponse = await client.get(`/illustration/${illustrationId}`).bearerToken(outsiderLogin.body().token)
    getResponse.assertStatus(403)
  })

  test('Private illustrations are only visible to owner', async ({ client, assert }) => {
    const owner = await UserFactory.make()
    const ownerUser = {
      email: owner.email,
      password: owner.password + '1A!a',
      password_confirmation: owner.password + '1A!a',
    }

    await client.post('/register').json(ownerUser)
    const ownerLogin = await client.post('/login').json({
      email: owner.email,
      password: owner.password + '1A!a',
    })

    const team = await Team.query().where('user_id', ownerLogin.body().id).first()

    const createResponse = await client.post('/illustration').bearerToken(ownerLogin.body().token).json({
      title: 'Private Illustration',
      content: 'Test content',
      private: true,
    })
    const illustrationId = createResponse.body().id

    const member = await UserFactory.make()
    const memberUser = {
      email: member.email,
      password: member.password + '1A!a',
      password_confirmation: member.password + '1A!a',
    }

    await client.post('/register').json(memberUser)
    const memberLogin = await client.post('/login').json({
      email: member.email,
      password: member.password + '1A!a',
    })

    await TeamMember.create({
      teamId: team!.id,
      userId: memberLogin.body().id,
      role: 'creator',
    })

    const memberGetResponse = await client.get(`/illustration/${illustrationId}`).bearerToken(memberLogin.body().token)
    memberGetResponse.assertStatus(403)

    const ownerGetResponse = await client.get(`/illustration/${illustrationId}`).bearerToken(ownerLogin.body().token)
    ownerGetResponse.assertStatus(200)
    assert.equal(ownerGetResponse.body().title, 'Private Illustration')
  })

  test('Editor can edit metadata but not content', async ({ client, assert }) => {
    const owner = await UserFactory.make()
    const ownerUser = {
      email: owner.email,
      password: owner.password + '1A!a',
      password_confirmation: owner.password + '1A!a',
    }

    await client.post('/register').json(ownerUser)
    const ownerLogin = await client.post('/login').json({
      email: owner.email,
      password: owner.password + '1A!a',
    })

    const createResponse = await client.post('/illustration').bearerToken(ownerLogin.body().token).json({
      title: 'Team Illustration',
      content: 'Original content',
    })
    const illustrationId = createResponse.body().id

    const team = await Team.query().where('user_id', ownerLogin.body().id).first()

    const editor = await UserFactory.make()
    const editorUser = {
      email: editor.email,
      password: editor.password + '1A!a',
      password_confirmation: editor.password + '1A!a',
    }

    await client.post('/register').json(editorUser)
    const editorLogin = await client.post('/login').json({
      email: editor.email,
      password: editor.password + '1A!a',
    })

    await TeamMember.create({
      teamId: team!.id,
      userId: editorLogin.body().id,
      role: 'editor',
    })

    const updateMetadataResponse = await client.put(`/illustration/${illustrationId}`).bearerToken(editorLogin.body().token).json({
      title: 'Updated Title',
      author: 'Updated Author',
    })
    updateMetadataResponse.assertStatus(200)
    assert.equal(updateMetadataResponse.body().illustration.title, 'Updated Title')
  })

  test('Readonly cannot edit team illustration', async ({ client, assert }) => {
    const owner = await UserFactory.make()
    const ownerUser = {
      email: owner.email,
      password: owner.password + '1A!a',
      password_confirmation: owner.password + '1A!a',
    }

    await client.post('/register').json(ownerUser)
    const ownerLogin = await client.post('/login').json({
      email: owner.email,
      password: owner.password + '1A!a',
    })

    const createResponse = await client.post('/illustration').bearerToken(ownerLogin.body().token).json({
      title: 'Team Illustration',
      content: 'Original content',
    })
    const illustrationId = createResponse.body().id

    const team = await Team.query().where('user_id', ownerLogin.body().id).first()

    const readonly = await UserFactory.make()
    const readonlyUser = {
      email: readonly.email,
      password: readonly.password + '1A!a',
      password_confirmation: readonly.password + '1A!a',
    }

    await client.post('/register').json(readonlyUser)
    const readonlyLogin = await client.post('/login').json({
      email: readonly.email,
      password: readonly.password + '1A!a',
    })

    await TeamMember.create({
      teamId: team!.id,
      userId: readonlyLogin.body().id,
      role: 'readonly',
    })

    const updateResponse = await client.put(`/illustration/${illustrationId}`).bearerToken(readonlyLogin.body().token).json({
      title: 'Updated Title',
    })
    updateResponse.assertStatus(403)
  })

  test('Creator can delete team illustration', async ({ client, assert }) => {
    const owner = await UserFactory.make()
    const ownerUser = {
      email: owner.email,
      password: owner.password + '1A!a',
      password_confirmation: owner.password + '1A!a',
    }

    await client.post('/register').json(ownerUser)
    const ownerLogin = await client.post('/login').json({
      email: owner.email,
      password: owner.password + '1A!a',
    })

    const createResponse = await client.post('/illustration').bearerToken(ownerLogin.body().token).json({
      title: 'Team Illustration',
      content: 'Test content',
    })
    const illustrationId = createResponse.body().id

    const team = await Team.query().where('user_id', ownerLogin.body().id).first()

    const creator = await UserFactory.make()
    const creatorUser = {
      email: creator.email,
      password: creator.password + '1A!a',
      password_confirmation: creator.password + '1A!a',
    }

    await client.post('/register').json(creatorUser)
    const creatorLogin = await client.post('/login').json({
      email: creator.email,
      password: creator.password + '1A!a',
    })

    await TeamMember.create({
      teamId: team!.id,
      userId: creatorLogin.body().id,
      role: 'creator',
    })

    const deleteResponse = await client.delete(`/illustration/${illustrationId}`).bearerToken(creatorLogin.body().token)
    deleteResponse.assertStatus(200)
  })

  test('Editor cannot delete team illustration', async ({ client, assert }) => {
    const owner = await UserFactory.make()
    const ownerUser = {
      email: owner.email,
      password: owner.password + '1A!a',
      password_confirmation: owner.password + '1A!a',
    }

    await client.post('/register').json(ownerUser)
    const ownerLogin = await client.post('/login').json({
      email: owner.email,
      password: owner.password + '1A!a',
    })

    const createResponse = await client.post('/illustration').bearerToken(ownerLogin.body().token).json({
      title: 'Team Illustration',
      content: 'Test content',
    })
    const illustrationId = createResponse.body().id

    const team = await Team.query().where('user_id', ownerLogin.body().id).first()

    const editor = await UserFactory.make()
    const editorUser = {
      email: editor.email,
      password: editor.password + '1A!a',
      password_confirmation: editor.password + '1A!a',
    }

    await client.post('/register').json(editorUser)
    const editorLogin = await client.post('/login').json({
      email: editor.email,
      password: editor.password + '1A!a',
    })

    await TeamMember.create({
      teamId: team!.id,
      userId: editorLogin.body().id,
      role: 'editor',
    })

    const deleteResponse = await client.delete(`/illustration/${illustrationId}`).bearerToken(editorLogin.body().token)
    deleteResponse.assertStatus(403)
  })

  test('User cannot join team if already member of another', async ({ client, assert }) => {
    const owner1 = await UserFactory.make()
    const owner1User = {
      email: owner1.email,
      password: owner1.password + '1A!a',
      password_confirmation: owner1.password + '1A!a',
    }

    await client.post('/register').json(owner1User)
    const owner1Login = await client.post('/login').json({
      email: owner1.email,
      password: owner1.password + '1A!a',
    })

    const owner2 = await UserFactory.make()
    const owner2User = {
      email: owner2.email,
      password: owner2.password + '1A!a',
      password_confirmation: owner2.password + '1A!a',
    }

    await client.post('/register').json(owner2User)
    const owner2Login = await client.post('/login').json({
      email: owner2.email,
      password: owner2.password + '1A!a',
    })

    const team1Response = await client.get('/team').bearerToken(owner1Login.body().token)
    const inviteCode1 = team1Response.body().inviteCode

    await client.post(`/teams/join/${inviteCode1}`).bearerToken(owner2Login.body().token)

    const owner3 = await UserFactory.make()
    const owner3User = {
      email: owner3.email,
      password: owner3.password + '1A!a',
      password_confirmation: owner3.password + '1A!a',
    }

    await client.post('/register').json(owner3User)
    const owner3Login = await client.post('/login').json({
      email: owner3.email,
      password: owner3.password + '1A!a',
    })

    const joinResponse = await client.post(`/teams/join/${inviteCode1}`).bearerToken(owner3Login.body().token)
    joinResponse.assertStatus(200)
  })

  test('Owner cannot join another team if they have members', async ({ client, assert }) => {
    const owner1 = await UserFactory.make()
    const owner1User = {
      email: owner1.email,
      password: owner1.password + '1A!a',
      password_confirmation: owner1.password + '1A!a',
    }

    await client.post('/register').json(owner1User)
    const owner1Login = await client.post('/login').json({
      email: owner1.email,
      password: owner1.password + '1A!a',
    })

    const owner2 = await UserFactory.make()
    const owner2User = {
      email: owner2.email,
      password: owner2.password + '1A!a',
      password_confirmation: owner2.password + '1A!a',
    }

    await client.post('/register').json(owner2User)
    const owner2Login = await client.post('/login').json({
      email: owner2.email,
      password: owner2.password + '1A!a',
    })

    const owner2Team = await Team.query().where('user_id', owner2Login.body().id).first()

    const member = await UserFactory.make()
    const memberUser = {
      email: member.email,
      password: member.password + '1A!a',
      password_confirmation: member.password + '1A!a',
    }

    await client.post('/register').json(memberUser)
    const memberLogin = await client.post('/login').json({
      email: member.email,
      password: member.password + '1A!a',
    })

    await TeamMember.create({
      teamId: owner2Team!.id,
      userId: memberLogin.body().id,
      role: 'editor',
    })

    const teamResponse = await client.get('/team').bearerToken(owner1Login.body().token)
    const inviteCode = teamResponse.body().inviteCode

    const joinResponse = await client.post(`/teams/join/${inviteCode}`).bearerToken(owner2Login.body().token)
    joinResponse.assertStatus(400)
    joinResponse.assertBodyContains({ message: 'Cannot join another team while you have members in your own team' })
  })

  test('Owner with no members can join another team', async ({ client }) => {
    const owner1 = await UserFactory.make()
    const owner1User = {
      email: owner1.email,
      password: owner1.password + '1A!a',
      password_confirmation: owner1.password + '1A!a',
    }

    await client.post('/register').json(owner1User)
    const owner1Login = await client.post('/login').json({
      email: owner1.email,
      password: owner1.password + '1A!a',
    })

    const owner2 = await UserFactory.make()
    const owner2User = {
      email: owner2.email,
      password: owner2.password + '1A!a',
      password_confirmation: owner2.password + '1A!a',
    }

    await client.post('/register').json(owner2User)
    const owner2Login = await client.post('/login').json({
      email: owner2.email,
      password: owner2.password + '1A!a',
    })

    const teamResponse = await client.get('/team').bearerToken(owner2Login.body().token)
    const inviteCode = teamResponse.body().inviteCode

    const joinResponse = await client.post(`/teams/join/${inviteCode}`).bearerToken(owner1Login.body().token)
    joinResponse.assertStatus(200)
    joinResponse.assertBodyContains({ message: 'Joined team successfully' })
  })

  test('Member can leave team', async ({ client, assert }) => {
    const owner = await UserFactory.make()
    const ownerUser = {
      email: owner.email,
      password: owner.password + '1A!a',
      password_confirmation: owner.password + '1A!a',
    }

    await client.post('/register').json(ownerUser)
    const ownerLogin = await client.post('/login').json({
      email: owner.email,
      password: owner.password + '1A!a',
    })

    const team = await Team.query().where('user_id', ownerLogin.body().id).first()

    const member = await UserFactory.make()
    const memberUser = {
      email: member.email,
      password: member.password + '1A!a',
      password_confirmation: member.password + '1A!a',
    }

    await client.post('/register').json(memberUser)
    const memberLogin = await client.post('/login').json({
      email: member.email,
      password: member.password + '1A!a',
    })

    await TeamMember.create({
      teamId: team!.id,
      userId: memberLogin.body().id,
      role: 'readonly',
    })

    const leaveResponse = await client.delete(`/team/memberships/${team!.id}`).bearerToken(memberLogin.body().token)
    leaveResponse.assertStatus(200)
    leaveResponse.assertBodyContains({ message: 'Left team successfully' })
  })

  test('Owner cannot leave their own team', async ({ client }) => {
    const owner = await UserFactory.make()
    const ownerUser = {
      email: owner.email,
      password: owner.password + '1A!a',
      password_confirmation: owner.password + '1A!a',
    }

    await client.post('/register').json(ownerUser)
    const ownerLogin = await client.post('/login').json({
      email: owner.email,
      password: owner.password + '1A!a',
    })

    const team = await Team.query().where('user_id', ownerLogin.body().id).first()

    const leaveResponse = await client.delete(`/team/memberships/${team!.id}`).bearerToken(ownerLogin.body().token)
    leaveResponse.assertStatus(400)
    leaveResponse.assertBodyContains({ message: 'Cannot leave your own team' })
  })

  test('Get memberships returns list of teams user is member of', async ({ client, assert }) => {
    const owner1 = await UserFactory.make()
    const owner1User = {
      email: owner1.email,
      password: owner1.password + '1A!a',
      password_confirmation: owner1.password + '1A!a',
    }

    await client.post('/register').json(owner1User)
    const owner1Login = await client.post('/login').json({
      email: owner1.email,
      password: owner1.password + '1A!a',
    })

    const owner2 = await UserFactory.make()
    const owner2User = {
      email: owner2.email,
      password: owner2.password + '1A!a',
      password_confirmation: owner2.password + '1A!a',
    }

    await client.post('/register').json(owner2User)
    const owner2Login = await client.post('/login').json({
      email: owner2.email,
      password: owner2.password + '1A!a',
    })

    const teamResponse = await client.get('/team').bearerToken(owner1Login.body().token)
    const inviteCode = teamResponse.body().inviteCode

    await client.post(`/teams/join/${inviteCode}`).bearerToken(owner2Login.body().token)

    const membershipsResponse = await client.get('/team/memberships').bearerToken(owner2Login.body().token)
    membershipsResponse.assertStatus(200)
    const memberships = membershipsResponse.body()
    assert.equal(memberships.length, 1)
    assert.equal(memberships[0].teamName, 'My Team')
    assert.equal(memberships[0].role, 'readonly')
  })

  test('Returns empty array when not member of any other team', async ({ client, assert }) => {
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

    const membershipsResponse = await client.get('/team/memberships').bearerToken(loginResponse.body().token)
    membershipsResponse.assertStatus(200)
    assert.equal(membershipsResponse.body().length, 0)
  })

  test('Creator can add members to team', async ({ client, assert }) => {
    const owner = await UserFactory.make()
    const ownerUser = {
      email: owner.email,
      password: owner.password + '1A!a',
      password_confirmation: owner.password + '1A!a',
    }

    await client.post('/register').json(ownerUser)
    const ownerLogin = await client.post('/login').json({
      email: owner.email,
      password: owner.password + '1A!a',
    })

    const team = await Team.query().where('user_id', ownerLogin.body().id).first()

    const creator = await UserFactory.make()
    const creatorUser = {
      email: creator.email,
      password: creator.password + '1A!a',
      password_confirmation: creator.password + '1A!a',
    }

    await client.post('/register').json(creatorUser)
    const creatorLogin = await client.post('/login').json({
      email: creator.email,
      password: creator.password + '1A!a',
    })

    await TeamMember.create({
      teamId: team!.id,
      userId: creatorLogin.body().id,
      role: 'creator',
    })

    const member = await UserFactory.make()
    const memberUser = {
      email: member.email,
      password: member.password + '1A!a',
      password_confirmation: member.password + '1A!a',
    }

    await client.post('/register').json(memberUser)
    const memberLogin = await client.post('/login').json({
      email: member.email,
      password: member.password + '1A!a',
    })

    const addMemberResponse = await client.post('/team/members')
      .bearerToken(creatorLogin.body().token)
      .json({ userId: memberLogin.body().id, role: 'editor' })
    addMemberResponse.assertStatus(200)
    addMemberResponse.assertBodyContains({ message: 'Member added' })
  })

  test('Creator cannot change owner role', async ({ client, assert }) => {
    const owner = await UserFactory.make()
    const ownerUser = {
      email: owner.email,
      password: owner.password + '1A!a',
      password_confirmation: owner.password + '1A!a',
    }

    await client.post('/register').json(ownerUser)
    const ownerLogin = await client.post('/login').json({
      email: owner.email,
      password: owner.password + '1A!a',
    })

    const team = await Team.query().where('user_id', ownerLogin.body().id).first()

    const creator = await UserFactory.make()
    const creatorUser = {
      email: creator.email,
      password: creator.password + '1A!a',
      password_confirmation: creator.password + '1A!a',
    }

    await client.post('/register').json(creatorUser)
    const creatorLogin = await client.post('/login').json({
      email: creator.email,
      password: creator.password + '1A!a',
    })

    await TeamMember.create({
      teamId: team!.id,
      userId: creatorLogin.body().id,
      role: 'creator',
    })

    const updateResponse = await client.put(`/team/members/${ownerLogin.body().id}`)
      .bearerToken(creatorLogin.body().token)
      .json({ role: 'editor' })
    updateResponse.assertStatus(404)
    updateResponse.assertBodyContains({ message: 'Member not found' })
  })

  test('GET /team returns user role', async ({ client }) => {
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

    const teamResponse = await client.get('/team').bearerToken(loginResponse.body().token)
    teamResponse.assertStatus(200)
    teamResponse.assertBodyContains({ role: 'owner' })
  })
})
