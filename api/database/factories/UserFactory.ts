import User from '#models/user'
import Factory from '@adonisjs/lucid/factories'

export default Factory.define(User, ({ faker }) => {
  const same_password = faker.internet.password({
    length: 32,
    memorable: false,
    pattern: /[a-zA-Z0-9!@#$%^&*]/,
  })
  return {
    email: faker.internet.email(),
    username: faker.internet.username(),
    password: same_password,
    // password_confirmation: same_password,
  }
}).build()
