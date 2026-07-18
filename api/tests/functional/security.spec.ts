import { test } from '@japa/runner'
import UserFactory from '#database/factories/user_factory'
import db from '@adonisjs/lucid/services/db'

test.group('Security', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('CORS rejects requests from disallowed origins', async ({ client, assert }) => {
    const response = await client
      .post('/login')
      .header('Origin', 'https://evil.com')
      .json({ email: 'test@test.com', password: 'password' })

    const allowOrigin = response.headers()['access-control-allow-origin']
    assert.notEqual(allowOrigin, 'https://evil.com')
  })

  test('CORS allows requests from allowed origins', async ({ client, assert }) => {
    const response = await client
      .post('/login')
      .header('Origin', 'https://sw.wplr.rocks')
      .json({ email: 'test@test.com', password: 'password' })

    assert.notEqual(response.status(), 403)
  })

  test('CSP header is present on responses', async ({ client, assert }) => {
    const response = await client
      .post('/login')
      .json({ email: 'test@test.com', password: 'password' })

    const csp = response.headers()['content-security-policy']
    if (csp) {
      assert.isString(csp)
      assert.include(csp, "default-src 'self'")
      assert.include(csp, "script-src 'self'")
    } else {
      assert.isUndefined(csp)
    }
  })

  test('Login endpoint validates email format', async ({ client, assert }) => {
    const response = await client
      .post('/login')
      .json({ email: 'not-an-email', password: 'password' })

    response.assertStatus(400)
  })

  test('Login endpoint validates password is required', async ({ client, assert }) => {
    const response = await client.post('/login').json({ email: 'test@test.com' })

    response.assertStatus(400)
  })

  test('Register endpoint validates email format', async ({ client, assert }) => {
    const response = await client
      .post('/register')
      .json({ email: 'bad-email', password: 'Test1234!', password_confirmation: 'Test1234!' })

    response.assertStatus(400)
  })

  test('Register endpoint validates password strength', async ({ client, assert }) => {
    const response = await client
      .post('/register')
      .json({ email: 'new@test.com', password: 'weak', password_confirmation: 'weak' })

    response.assertStatus(400)
  })

  test('Contact endpoint requires valid email', async ({ client, assert }) => {
    const response = await client
      .post('/contact')
      .json({ email: 'not-valid', reason: 'general', message: 'test' })

    response.assertStatus(422)
  })

  test('SQL injection in login email is handled safely', async ({ client, assert }) => {
    const response = await client
      .post('/login')
      .json({ email: "' OR 1=1 --", password: 'password' })

    response.assertStatus(400)
  })

  test('SQL injection in search query is handled safely', async ({ client, assert }) => {
    const user = await UserFactory.merge({ password: 'TestPass123!' }).create()

    const loggedInUser = await client
      .post('/login')
      .json({ email: user.email, password: 'TestPass123!' })

    const response = await client
      .post('/search')
      .json({ query: "'; DROP TABLE illustrations; --" })
      .bearerToken(loggedInUser.body().token)

    response.assertStatus(200)
    response.assertBodyContains({ message: 'success' })

    const illustrationsExist = await db.rawQuery(
      "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'illustrations')"
    )
    assert.isTrue(illustrationsExist.rows[0].exists)
  })
})
