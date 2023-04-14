//@ts-nocheck
import { processCliArgs, test } from '@japa/runner'
import UserFactory from 'Database/factories/UserFactory'
import User from 'App/Models/User'
import Database from '@ioc:Adonis/Lucid/Database'

test.group('Users', (group) => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
    return () => Database.rollbackGlobalTransaction()
  })
  test('Can create an account', async ({ client, assert }) => {

    const user = await UserFactory.make()
    let fixedUser = {
      email: user.email,
      password: user.password+"1A!a",
      password_confirmation: user.password+"1A!a"
    }

    const response = await client.post('/register').json(fixedUser)

    response.assertBodyContains({message: 'Created successfully'})
    response.assertBodyContains({uid: response.body().uid})
    response.assertStatus(200)

    const loggedInUser = await client.post('/login').json({email: user.email, password: user.password+"1A!a"})

    const verify = await client.get(`/users/${response.body().uid}`).bearerToken(loggedInUser.body().token)
    verify.assertStatus(200)
    const verify401 = await client.get(`/users/${response.body().uid}`)
    verify401.assertStatus(401)

  })

  test('Bad passwords', async ({ client, assert }) => {
    // no password
    const user = await UserFactory.make()
    let fixedUser = {
      email: user.email
    }

    const response = await client.post('/register').json(fixedUser)

    response.assertStatus(400)
    assert.equal(response.body().errors[0].message, 'The password field is required')

    // weak password
    fixedUser.password_confirmation = '12345'
    fixedUser.password = '12345'

    const weak = await client.post('/register').json(fixedUser)

    weak.assertStatus(400)
    assert.equal(weak.body().errors[0].message, 'The password field must be at least 8 characters with one of the following: a number, uppercase character, and lowercase character.')

    // don't match
    fixedUser.password = 'Aa12345678'
    fixedUser.password_confirmation = 'Aaa12345678'
    const match = await client.post('/register').json(fixedUser)

    match.assertStatus(400)
    assert.equal(match.body().errors[0].message, 'confirmed validation failed')
  })

  test('Bad emails', async ({ client, assert }) => {
    await client.post('/register').json({ email: 'test@test.com', password: 'testING123!!', password_confirmation: 'testING123!!' })

    const user = await UserFactory.make()
    let fixedUser = {
      email: user.email,
      password: user.password,
      password_confirmation: user.password
    }

    // not valid
    fixedUser.email = 'test@test'

    const weak = await client.post('/register').json(fixedUser)

    weak.assertStatus(400)
    assert.equal(weak.body().errors[0].message, 'Enter a valid email address')

    // no email
    fixedUser.email = ''

    const none = await client.post('/register').json(fixedUser)

    none.assertStatus(400)
    assert.equal(none.body().errors[0].message, 'The email field is required')

    // unique

    fixedUser.email = 'test@test.com'
    const duplicate = await client.post('/register').json(fixedUser)

    duplicate.assertStatus(400)
    assert.equal(duplicate.body().errors[0].message, 'Email already exists')
  })


  test('Can log in and get API token', async ({ client, assert }) => {

    const user = await UserFactory.make()

    const userLogin = {
      email: user.email,
      password: user.password,
    }
    await User.create(userLogin)

    const response = await client.post('/login').json(userLogin)

    response.assertStatus(200)
  })

  test('Pretty error on unsuccessful login', async ({ client, assert }) => {
    const user = await UserFactory.make()
    let goodUser = {
      email: user.email,
      password: user.password
    }
    const bd = await UserFactory.make()
    let baduser = {
      email: bd.email,
      password: bd.password
    }
    await User.create(goodUser)

    const login = await client.post('/login').json(baduser)
    login.assertStatus(401)
    assert.equal(login.body().message, 'Username or password is incorrect')
  })


  test('User is locked out after 5 invalid attemps', async ({ client, assert }) => {

    const user = { email: 'test@test.com', password: 'badpassword' }

    await client.post('/login').json(user)
    await client.post('/login').json(user)
    await client.post('/login').json(user)
    await client.post('/login').json(user)
    await client.post('/login').json(user)
    await client.post('/login').json(user)
    await client.post('/login').json(user)
    await client.post('/login').json(user)
    const login = await client.post('/login').json(user)
    console.log(login.body())
    login.assertStatus(429)
    assert.equal(login.body().message, 'Too many requests. Please wait 30 minutes and try again.')

  })
})
