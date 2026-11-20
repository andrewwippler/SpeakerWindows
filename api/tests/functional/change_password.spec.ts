import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import UserFactory from '#database/factories/user_factory'
import TeamMember from '#models/team_member'
import User from '#models/user'

async function registerAndLogin(client: any, email: string, password: string) {
  await client.post('/api/register').json({
    email,
    password,
    password_confirmation: password,
  })

  const response = await client.post('/api/login').json({ email, password })
  return response.body()
}

test.group('Temporary member passwords', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('Adds an unknown email as a member with a temporary password', async ({
    client,
    assert,
  }) => {
    const owner = await UserFactory.make()
    const ownerPassword = owner.password + '1A!a'
    const ownerLogin = await registerAndLogin(client, owner.email, ownerPassword)
    const newEmail = `new-member-${Date.now()}@example.com`

    const response = await client
      .post('/api/team/members')
      .bearerToken(ownerLogin.token)
      .json({ email: newEmail, role: 'editor' })

    response.assertStatus(200)
    response.assertBodyContains({ message: 'Member added', email: newEmail })
    assert.isString(response.body().temporaryPassword)
    assert.isAtLeast(response.body().temporaryPassword.length, 8)

    const member = await User.query().where('email', newEmail).firstOrFail()
    assert.isTrue(member.mustChangePassword)
    assert.notEqual(member.password, response.body().temporaryPassword)

    const membership = await TeamMember.query().where('user_id', member.id).firstOrFail()
    assert.equal(membership.role, 'editor')

    const login = await client
      .post('/api/login')
      .json({ email: newEmail, password: response.body().temporaryPassword })
    login.assertStatus(200)
    login.assertBodyContains({ mustChangePassword: true })
  })

  test('Clears the temporary password flag after the password is changed', async ({
    client,
    assert,
  }) => {
    const owner = await UserFactory.make()
    const ownerPassword = owner.password + '1A!a'
    const ownerLogin = await registerAndLogin(client, owner.email, ownerPassword)
    const newEmail = `password-change-${Date.now()}@example.com`

    const addResponse = await client
      .post('/api/team/members')
      .bearerToken(ownerLogin.token)
      .json({ email: newEmail, role: 'readonly' })

    const temporaryPassword = addResponse.body().temporaryPassword
    const login = await client
      .post('/api/login')
      .json({ email: newEmail, password: temporaryPassword })
    const token = login.body().token

    const blocked = await client.get('/api/team').bearerToken(token)
    blocked.assertStatus(403)
    blocked.assertBodyContains({ message: 'Password change required' })

    const wrongCurrent = await client.post('/api/change-password').bearerToken(token).json({
      currentPassword: 'WrongPassword123!',
      newPassword: 'ChangedPassword123!',
      newPassword_confirmation: 'ChangedPassword123!',
    })
    wrongCurrent.assertStatus(400)
    wrongCurrent.assertBodyContains({ message: 'Current password is incorrect' })

    const changed = await client.post('/api/change-password').bearerToken(token).json({
      currentPassword: temporaryPassword,
      newPassword: 'ChangedPassword123!',
      newPassword_confirmation: 'ChangedPassword123!',
    })
    changed.assertStatus(200)
    changed.assertBodyContains({ message: 'Password changed' })

    const member = await User.query().where('email', newEmail).firstOrFail()
    assert.isFalse(member.mustChangePassword)

    const oldLogin = await client
      .post('/api/login')
      .json({ email: newEmail, password: temporaryPassword })
    oldLogin.assertStatus(401)

    const newLogin = await client
      .post('/api/login')
      .json({ email: newEmail, password: 'ChangedPassword123!' })
    newLogin.assertStatus(200)
    newLogin.assertBodyContains({ mustChangePassword: false })

    const team = await client.get('/api/team').bearerToken(token)
    team.assertStatus(200)
  })

  test('Adds an existing user without generating a temporary password', async ({
    client,
    assert,
  }) => {
    const owner = await UserFactory.make()
    const ownerPassword = owner.password + '1A!a'
    const ownerLogin = await registerAndLogin(client, owner.email, ownerPassword)

    const member = await UserFactory.make()
    const memberPassword = member.password + '1A!a'
    await registerAndLogin(client, member.email, memberPassword)

    const response = await client
      .post('/api/team/members')
      .bearerToken(ownerLogin.token)
      .json({ email: member.email, role: 'creator' })

    response.assertStatus(200)
    response.assertBodyContains({ message: 'Member added', email: member.email })
    assert.isNull(response.body().temporaryPassword)

    const savedMember = await User.query().where('email', member.email).firstOrFail()
    assert.isFalse(savedMember.mustChangePassword)
  })

  test('Rejects invalid emails and self-adds', async ({ client }) => {
    const owner = await UserFactory.make()
    const ownerPassword = owner.password + '1A!a'
    const ownerLogin = await registerAndLogin(client, owner.email, ownerPassword)

    const invalid = await client
      .post('/api/team/members')
      .bearerToken(ownerLogin.token)
      .json({ email: 'not-an-email', role: 'editor' })
    invalid.assertStatus(422)

    const self = await client
      .post('/api/team/members')
      .bearerToken(ownerLogin.token)
      .json({ email: owner.email, role: 'editor' })
    self.assertStatus(400)
    self.assertBodyContains({ message: 'Cannot add yourself' })
  })
})
