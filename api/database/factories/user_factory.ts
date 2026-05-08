import User from '#models/user'
import Factory from '@adonisjs/lucid/factories'

export default Factory.define(User, ({ faker }) => {
  const samePassword = faker.internet.password({
    length: 32,
    memorable: false,
    pattern: /[a-zA-Z0-9!@#$%^&*]/,
  })
  return {
    email: faker.internet.email(),
    password: samePassword,
    // password_confirmation: same_password,
  }
}).build()
