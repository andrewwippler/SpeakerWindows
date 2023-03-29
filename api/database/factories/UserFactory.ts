import User from 'App/Models/User'
import Factory from '@ioc:Adonis/Lucid/Factory'

export default Factory.define(User, ({ faker }) => {
  const same_password = faker.internet.password(32,false,/[a-zA-Z0-9!@#$%^&*]/)
  return {
    email: faker.internet.email(),
    password: same_password,
    // password_confirmation: same_password,
  }
}).build()
