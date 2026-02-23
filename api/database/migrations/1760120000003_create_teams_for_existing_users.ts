import { BaseSchema } from '@adonisjs/lucid/schema'
import db from '@adonisjs/lucid/services/db'

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export default class extends BaseSchema {
  protected tableName = 'teams'

  public async up() {
    const users = await db.from('users').select('id')

    for (const user of users) {
      const inviteCode = generateInviteCode()

      const teamId = await db
        .table('teams')
        .insert({
          invite_code: inviteCode,
          name: 'My Team',
          user_id: user.id,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning('id')

      await db.table('team_members').insert({
        team_id: teamId[0].id,
        user_id: user.id,
        role: 'owner',
        created_at: new Date(),
      })
    }
  }

  public async down() {
    // This migration only creates data, no schema changes
    // Nothing to revert - the teams and team_members tables will be dropped by their own migration files
  }
}
