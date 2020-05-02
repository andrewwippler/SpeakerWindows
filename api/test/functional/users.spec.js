'use strict'

const { test, trait, before } = use('Test/Suite')('Users')
const Illustration = use('App/Models/Illustration')
const Tag = use('App/Models/Tag')
const Place = use('App/Models/Place')
const User = use('App/Models/User')
const Factory = use('Factory')

trait('Test/ApiClient')
trait('Auth/Client')

before(async () => {
  // executed before all the tests for a given suite

})

test('Can create an account', async ({ client, assert }) => {

  const user = await Factory.model('App/Models/User').make()
  let fixedUser = user.toJSON()
  fixedUser.password = fixedUser.password_confirmation

  const response = await client.post('/register').send(fixedUser).end()

  response.assertStatus(200)
  assert.equal(response.body.message,'Created successfully')
  assert.isTrue(!!response.body.uid)

  const loggedInUser = await User.findBy({ uid: response.body.uid })

  const verify = await client.get(`/users/${response.body.uid}`).loginVia(loggedInUser, 'jwt').end()
  verify.assertStatus(200)

})

test('Bad passwords', async ({ client, assert }) => {
  // no password
  const user = await Factory.model('App/Models/User').make({ password: '' })
  let fixedUser = user.toJSON()
  fixedUser.password = fixedUser.password_confirmation

  const response = await client.post('/register').send(fixedUser).end()

  response.assertStatus(400)
  assert.equal(response.body[0].message, 'The password field is required')

  // weak password
  fixedUser.password_confirmation = '12345'
  fixedUser.password = '12345'

  const weak = await client.post('/register').send(fixedUser).end()

  weak.assertStatus(400)
  assert.equal(weak.body[0].message, 'The password field must be at least 8 characters with one of the following: a number, uppercase character, and lowercase character.')

  // don't match
  fixedUser.password = 'Aa12345678'
  fixedUser.password_confirmation = 'Aaa12345678'
  const match = await client.post('/register').send(fixedUser).end()

  match.assertStatus(400)
  assert.equal(match.body[0].message, 'The password fields do not match')
})

test('Bad emails', async ({ client, assert }) => {
  await client.post('/register').send({ email: 'test@test.com', password: 'testING123!!', password_confirmation: 'testING123!!' }).end()

  const user = await Factory.model('App/Models/User').make()
  let fixedUser = user.toJSON()
  fixedUser.password = fixedUser.password_confirmation

  // not valid
  fixedUser.email = 'test@test'

  const weak = await client.post('/register').send(fixedUser).end()

  weak.assertStatus(400)
  assert.equal(weak.body[0].message, 'Enter a valid email address')

  // no email
  fixedUser.email = ''

  const none = await client.post('/register').send(fixedUser).end()

  none.assertStatus(400)
  assert.equal(none.body[0].message, 'The email field is required')

  // unique

  fixedUser.email = 'test@test.com'
  const duplicate = await client.post('/register').send(fixedUser).end()

  duplicate.assertStatus(400)
  assert.equal(duplicate.body[0].message, 'Email already exists')
})


test('Can log in and get API token', async ({ client, assert }) => {
  const user = await Factory.model('App/Models/User').make()
  let fixedUser = user.toJSON()
  const userLogin = {email: fixedUser.email, password: fixedUser.password_confirmation}
  await User.create(userLogin)

  const response = await client.post('/login').send(userLogin).end()

  response.assertStatus(200)
  assert.equal(response.body.type,'bearer')
})

test('Pretty error on unsuccessful login', async ({ client, assert }) => {
  const goodUser = { email: 'test2@test.com', password: 'Aaatest123' }
  await User.create(goodUser)
  const baduser = { email: 'test2@test.com', password: 'badpassword' }

  const login = await client.post('/login').send(baduser).end()
  login.assertStatus(401)
  assert.equal(login.body.message, 'Username or password is incorrect')

})


test('User is locked out after 5 invalid attemps', async ({ client, assert }) => {

  const user = { email: 'test@test.com', password: 'badpassword' }

  await client.post('/login').send(user).end()
  await client.post('/login').send(user).end()
  await client.post('/login').send(user).end()
  await client.post('/login').send(user).end()
  await client.post('/login').send(user).end()
  const login = await client.post('/login').send(user).end()
  login.assertStatus(429)
  assert.equal(login.body.message, 'Too many requests. Please wait 30 minutes and try again.')

})

