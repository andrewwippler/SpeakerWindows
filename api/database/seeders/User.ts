import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

export default class extends BaseSeeder {
  public async run () {
    await User.updateOrCreateMany('email', [{ email: 'test@test.com', password: 'Test1234' },{ email: 'test5@test.com', password: 'Test12345' }])
  }
}
