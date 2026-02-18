import type { HttpContext } from '@adonisjs/core/http'
import Team from '#models/team'
import TeamMember from '#models/team_member'
import User from '#models/user'
import Illustration from '#models/illustration'
import type { TeamRole } from '#models/team'

export default class TeamsController {
  public async getTeam({ auth }: HttpContext) {
    const user = auth.user!

    const team = await Team.query().where('user_id', user.id).first()
    if (!team) {
      return { message: 'Team not found' }
    }

    const members = await TeamMember.query()
      .where('team_id', team.id)
      .preload('user', (query) => {
        query.select('id', 'username', 'email')
      })

    return {
      id: team.id,
      name: team.name,
      inviteCode: team.inviteCode,
      role: 'owner',
      members: members.map((m) => ({
        userId: m.userId,
        username: m.user.username,
        email: m.user.email,
        role: m.role,
      })),
    }
  }

  public async updateTeam({ auth, request }: HttpContext) {
    const user = auth.user!
    const { name } = request.all()

    const team = await Team.query().where('user_id', user.id).first()
    if (!team) {
      return { message: 'Team not found' }
    }

    team.name = name
    await team.save()

    return { message: 'Team updated', name: team.name }
  }

  public async getMembers({ auth }: HttpContext) {
    const user = auth.user!

    const team = await Team.query().where('user_id', user.id).first()
    if (!team) {
      return { message: 'Team not found' }
    }

    const members = await TeamMember.query()
      .where('team_id', team.id)
      .preload('user', (query) => {
        query.select('id', 'username', 'email')
      })

    return members.map((m) => ({
      userId: m.userId,
      username: m.user.username,
      email: m.user.email,
      role: m.role,
    }))
  }

  public async addMember({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const { userId, role } = request.all()

    const team = await Team.query().where('user_id', user.id).first()
    if (!team) {
      return response.status(404).send({ message: 'Team not found' })
    }

    const userMembership = await TeamMember.query()
      .where('team_id', team.id)
      .where('user_id', user.id)
      .first()

    if (!userMembership || (userMembership.role !== 'owner' && userMembership.role !== 'creator')) {
      return response.status(403).send({ message: 'Only owners and creators can add members' })
    }

    const existingMember = await TeamMember.query()
      .where('team_id', team.id)
      .where('user_id', userId)
      .first()

    if (existingMember) {
      return response.status(400).send({ message: 'User is already a member' })
    }

    await TeamMember.create({
      teamId: team.id,
      userId: userId,
      role: role as TeamRole,
    })

    return { message: 'Member added' }
  }

  public async updateMember({ auth, request, response, params }: HttpContext) {
    const user = auth.user!
    const { userId } = params
    const { role } = request.all()

    const team = await Team.query().where('user_id', user.id).first()
    if (!team) {
      return response.status(404).send({ message: 'Team not found' })
    }

    const member = await TeamMember.query()
      .where('team_id', team.id)
      .where('user_id', userId)
      .first()

    if (!member) {
      return response.status(404).send({ message: 'Member not found' })
    }

    if (member.role === 'owner') {
      return response.status(400).send({ message: 'Cannot change owner role' })
    }

    member.role = role as TeamRole
    await member.save()

    return { message: 'Member updated' }
  }

  public async removeMember({ auth, response, params }: HttpContext) {
    const user = auth.user!
    const { userId } = params

    const team = await Team.query().where('user_id', user.id).first()
    if (!team) {
      return response.status(404).send({ message: 'Team not found' })
    }

    const member = await TeamMember.query()
      .where('team_id', team.id)
      .where('user_id', userId)
      .first()

    if (!member) {
      return response.status(404).send({ message: 'Member not found' })
    }

    if (member.role === 'owner') {
      return response.status(400).send({ message: 'Cannot remove owner' })
    }

    await member.delete()

    return { message: 'Member removed' }
  }

  public async joinTeam({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const { inviteCode } = params

    const team = await Team.query().where('invite_code', inviteCode).first()
    if (!team) {
      return response.status(404).send({ message: 'Team not found' })
    }

    const existingMember = await TeamMember.query()
      .where('team_id', team.id)
      .where('user_id', user.id)
      .first()

    if (existingMember) {
      return response.status(400).send({ message: 'Already a member of this team' })
    }

    const userTeam = await Team.query().where('user_id', user.id).first()
    if (userTeam?.id === team.id) {
      return response.status(400).send({ message: 'Cannot join your own team' })
    }

    if (userTeam) {
      const teamMemberCount = await TeamMember.query()
        .where('team_id', userTeam.id)
        .where('user_id', '!=', user.id)
        .count('* as total')
        .first()

      if (teamMemberCount && Number(teamMemberCount.$extras.total) > 0) {
        return response.status(400).send({ message: 'Cannot join another team while you have members in your own team' })
      }

      const membershipInOtherTeam = await TeamMember.query()
        .where('user_id', user.id)
        .where('team_id', '!=', userTeam.id)
        .first()

      if (membershipInOtherTeam) {
        return response.status(400).send({ message: 'Already a member of another team. Leave your current team first before joining another.' })
      }
    }

    await TeamMember.create({
      teamId: team.id,
      userId: user.id,
      role: 'readonly',
    })

    return { message: 'Joined team successfully' }
  }

  public async getTeamIllustrations({ auth }: HttpContext) {
    const user = auth.user!

    const memberships = await TeamMember.query().where('user_id', user.id)
    const teamIds = memberships.map((m) => m.teamId)

    const illustrations = await Illustration.query()
      .whereIn('team_id', teamIds)
      .andWhere('private', false)
      .preload('user', (query) => {
        query.select('id', 'username')
      })

    return illustrations.map((ill) => ({
      id: ill.id,
      title: ill.title,
      author: ill.author,
      source: ill.source,
      user_id: ill.userId,
      team_id: ill.teamId,
      private: ill.private,
      createdAt: ill.createdAt,
      user: ill.user,
    }))
  }

  public async getMemberships({ auth }: HttpContext) {
    const user = auth.user!

    const userTeam = await Team.query().where('user_id', user.id).first()
    if (!userTeam) {
      return []
    }

    const memberships = await TeamMember.query()
      .where('user_id', user.id)
      .where('team_id', '!=', userTeam.id)
      .preload('team')

    return memberships.map((m) => ({
      teamId: m.teamId,
      teamName: m.team.name,
      role: m.role,
    }))
  }

  public async leaveTeam({ auth, response, params }: HttpContext) {
    const user = auth.user!
    const { teamId } = params

    const userTeam = await Team.query().where('user_id', user.id).first()
    if (userTeam?.id === Number(teamId)) {
      return response.status(400).send({ message: 'Cannot leave your own team' })
    }

    const membership = await TeamMember.query()
      .where('team_id', teamId)
      .where('user_id', user.id)
      .first()

    if (!membership) {
      return response.status(404).send({ message: 'Membership not found' })
    }

    await membership.delete()

    return { message: 'Left team successfully' }
  }

  public async getUserRoleForTeam({ auth, teamId }: { auth: HttpContext['auth']; teamId: number }) {
    const user = auth.user!

    const membership = await TeamMember.query()
      .where('team_id', teamId)
      .where('user_id', user.id)
      .first()

    if (!membership) {
      return null
    }

    return membership.role
  }
}
