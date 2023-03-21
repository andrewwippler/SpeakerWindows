import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import User from 'App/Models/User'

export default class extends BaseSeeder {
  public async run () {
    await User.updateOrCreateMany('email', [{ email: 'test@test.com', password: 'Test1234' },{ email: 'test5@test.com', password: 'Test12345' }])
  }
}
