import { BaseCommand, flags } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import Team from '#models/team'
import TeamMember from '#models/team_member'
import { v4 as uuid } from 'uuid'
import type { TeamRole } from '#models/team'

export default class UserTeam extends BaseCommand {
  static commandName = 'user:team'
  static description = 'Manage user team associations'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.number({
    description: 'User ID to manage',
  })
  declare userId: number | undefined

  @flags.string({
    description: 'Action to perform: create, remove, or add',
  })
  declare action: string | undefined

  @flags.string({
    description: 'Team name (required for create action)',
    default: 'CLI Created Team',
  })
  declare name: string | undefined

  @flags.number({
    description: 'Team ID (required for add action)',
  })
  declare teamId: number | undefined

  @flags.string({
    description: 'Role for add action (owner, creator, editor, readonly)',
    default: 'readonly',
  })
  declare role: string | undefined

  async run() {
    const userId = this.userId
    const action = this.action

    if (!userId) {
      this.logger.error('--user-id is required')
      return
    }

    if (!action || !['create', 'remove', 'add'].includes(action)) {
      this.logger.error('--action is required and must be: create, remove, or add')
      return
    }

    const user = await User.find(userId)
    if (!user) {
      this.logger.error(`User with ID ${userId} not found`)
      return
    }

    switch (action) {
      case 'create':
        await this.createTeam(user)
        break
      case 'remove':
        await this.removeFromTeams(user)
        break
      case 'add':
        await this.addToTeam(user)
        break
      default:
        this.logger.error(`Unknown action: ${action}`)
    }
  }

  private async createTeam(user: User) {
    if (!this.name) {
      this.logger.error('--name is required for create action')
      return
    }

    const existingTeam = await Team.query().where('userId', user.id).first()
    if (existingTeam) {
      this.logger.error(`User ${user.id} already owns a team (ID: ${existingTeam.id})`)
      return
    }

    const trx = await db.transaction()
    try {
      const team = await Team.create(
        {
          name: this.name,
          userId: user.id,
          inviteCode: uuid(),
        },
        { client: trx }
      )

      await TeamMember.create(
        {
          teamId: team.id,
          userId: user.id,
          role: 'owner',
        },
        { client: trx }
      )

      await trx.commit()
      this.logger.success(`Created team "${this.name}" (ID: ${team.id}) for user ${user.id}`)
    } catch (error) {
      await trx.rollback()
      this.logger.error(`Failed to create team: ${error.message}`)
    }
  }

  private async removeFromTeams(user: User) {
    const memberships = await TeamMember.query()
      .where('userId', user.id)
      .whereNot('role', 'owner')
      .exec()

    if (memberships.length === 0) {
      this.logger.info(`User ${user.id} is not a member of any team they don't own`)
      return
    }

    const teamIds = memberships.map((m) => m.teamId)
    await TeamMember.query()
      .where('userId', user.id)
      .whereNot('role', 'owner')
      .delete()

    this.logger.success(`Removed user ${user.id} from ${teamIds.length} team(s): ${teamIds.join(', ')}`)
  }

  private async addToTeam(user: User) {
    if (!this.teamId) {
      this.logger.error('--team-id is required for add action')
      return
    }

    const team = await Team.find(this.teamId)
    if (!team) {
      this.logger.error(`Team with ID ${this.teamId} not found`)
      return
    }

    const existingMembership = await TeamMember.query()
      .where('userId', user.id)
      .whereNot('role', 'owner')
      .first()

    if (existingMembership) {
      this.logger.error(
        `User ${user.id} is already a member of team ${existingMembership.teamId} (role: ${existingMembership.role}). Remove them first before adding to another team.`
      )
      return
    }

    const alreadyMember = await TeamMember.query()
      .where('userId', user.id)
      .where('teamId', this.teamId)
      .first()

    if (alreadyMember) {
      this.logger.error(`User ${user.id} is already a member of team ${this.teamId}`)
      return
    }

    const validRoles: TeamRole[] = ['owner', 'creator', 'editor', 'readonly']
    let role: TeamRole = 'readonly'
    if (this.role && validRoles.includes(this.role as TeamRole)) {
      role = this.role as TeamRole
    } else if (this.role) {
      this.logger.info(`Invalid role "${this.role}", defaulting to "readonly"`)
    }

    await TeamMember.create({
      teamId: team.id,
      userId: user.id,
      role: role,
    })

    this.logger.success(`Added user ${user.id} to team ${team.id} (${team.name}) as ${role}`)
  }
}
