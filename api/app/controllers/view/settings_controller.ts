import type { HttpContext } from '@adonisjs/core/http'
import Setting from '#models/setting'
import Illustration from '#models/illustration'
import User from '#models/user'
import Team from '#models/team'
import TeamMember from '#models/team_member'
import type { TeamRole } from '#models/team'
import { ImportHighlightsService } from '#services/import_highlights_service'
import { addTeamMemberByEmail } from '#services/team_member_service'
import { AddTeamMemberValidator } from '#validators/add_team_member_validator'
import { generateInviteCode } from '#services/invite_code_service'

export default class SettingsController {
  public async index({ auth, view }: HttpContext) {
    try {
      const user = auth.user!

      let settings = await Setting.query().where('user_id', `${user.id}`).first()
      let settingsData = settings ? JSON.parse(JSON.stringify(settings)) : {}

      const tag = await Illustration.query()
        .whereHas('tags', (query) => {
          query.where('name', 'To-Fix').orWhere('name', 'Untitled')
        })
        .where('user_id', `${user.id}`)
      if (tag) {
        const count = tag.length ? tag.length : 0
        settingsData = { ...settingsData, count }
      }

      const tagQuery2 = await Illustration.query().where('user_id', `${user.id}`).doesntHave('tags')
      const count2 = tagQuery2.length ? tagQuery2.length : 0
      settingsData = { ...settingsData, emptyTags: count2 }

      const illustrationsCount = await Illustration.query()
        .where('user_id', `${user.id}`)
        .count('* as total')

      let team = await Team.query().where('user_id', user.id).first()
      if (!team) {
        team = await Team.create({
          inviteCode: generateInviteCode(),
          name: 'My Team',
          userId: user.id,
        })
        await TeamMember.create({ teamId: team.id, userId: user.id, role: 'owner' })
      }

      const members = await TeamMember.query()
        .where('team_id', team.id)
        .preload('user', (query) => {
          query.select('id', 'email')
        })

      const token = await User.accessTokens.create(user)
      const apiToken = token.value!.release()

      return view.render('settings/index', {
        settings: settingsData,
        illustrationsCount: Number(illustrationsCount[0].$extras.total),
        team: {
          id: team.id,
          name: team.name,
          inviteCode: team.inviteCode,
          members: members.map((m) => ({
            userId: m.userId,
            email: m.user.email,
            role: m.role,
          })),
        },
        apiToken,
      })
    } catch (error) {
      console.error('Settings error:', error)
      return view.render('settings/index', {
        settings: {},
        illustrationsCount: 0,
        team: { id: null, name: '', inviteCode: '', members: [] },
        apiToken: '',
      })
    }
  }

  public async update({ request, auth, response, session }: HttpContext) {
    const { place, location } = request.all()

    try {
      const settings = await Setting.firstOrCreate({ user_id: auth.user?.id })
      settings.place = place
      settings.location = location
      await settings.save()

      session.flash('success', 'Settings saved!')
    } catch (error) {
      console.error('Settings update error:', error)
      session.flash('error', 'Failed to save settings')
    }

    return response.redirect('back')
  }

  public async addMember({ request, auth, response, session }: HttpContext) {
    const user = auth.user!
    const { email, role } = request.all()

    try {
      const team = await Team.query().where('user_id', user.id).first()
      if (!team) {
        session.flash('error', 'Team not found')
        return response.redirect('back')
      }

      const userMembership = await TeamMember.query()
        .where('team_id', team.id)
        .where('user_id', user.id)
        .first()

      if (
        !userMembership ||
        (userMembership.role !== 'owner' && userMembership.role !== 'creator')
      ) {
        session.flash('error', 'Only owners and creators can add members')
        return response.redirect('back')
      }

      let payload
      try {
        payload = await AddTeamMemberValidator.validate({ email, role: role || 'editor' })
      } catch {
        session.flash('error', 'Enter a valid email address and role')
        return response.redirect('back')
      }

      const invitedUser = await User.query()
        .whereRaw('LOWER(email) = ?', [payload.email.toLowerCase()])
        .first()

      if (invitedUser?.id === user.id) {
        session.flash('error', 'Cannot add yourself')
        return response.redirect('back')
      }

      if (invitedUser) {
        const existing = await TeamMember.query()
          .where('team_id', team.id)
          .where('user_id', invitedUser.id)
          .first()

        if (existing) {
          session.flash('error', 'User is already a member')
          return response.redirect('back')
        }
      }

      const result = await addTeamMemberByEmail(team.id, payload.email, payload.role)
      if (result.temporaryPassword) {
        session.flash(
          'success',
          `Member added. Share the temporary password with ${result.user.email}.`
        )
        session.flash('temporaryCredentials', {
          email: result.user.email,
          password: result.temporaryPassword,
        })
      } else {
        session.flash('success', 'Member added')
      }
    } catch (error) {
      console.error('Add member error:', error)
      session.flash('error', 'Failed to add member')
    }

    return response.redirect('back')
  }

  public async updateMember({ request, auth, response, session, params }: HttpContext) {
    const user = auth.user!
    const { userId } = params
    const { role } = request.all()

    try {
      const team = await Team.query().where('user_id', user.id).first()
      if (!team) {
        session.flash('error', 'Team not found')
        return response.redirect('back')
      }

      const member = await TeamMember.query()
        .where('team_id', team.id)
        .where('user_id', userId)
        .first()

      if (!member) {
        session.flash('error', 'Member not found')
        return response.redirect('back')
      }

      if (member.role === 'owner') {
        session.flash('error', 'Cannot change owner role')
        return response.redirect('back')
      }

      member.role = role as TeamRole
      await member.save()
      session.flash('success', 'Member updated')
    } catch (error) {
      console.error('Update member error:', error)
      session.flash('error', 'Failed to update member')
    }

    return response.redirect('back')
  }

  public async removeMember({ auth, response, session, params }: HttpContext) {
    const user = auth.user!
    const { userId } = params

    try {
      const team = await Team.query().where('user_id', user.id).first()
      if (!team) {
        session.flash('error', 'Team not found')
        return response.redirect('back')
      }

      const member = await TeamMember.query()
        .where('team_id', team.id)
        .where('user_id', userId)
        .first()

      if (!member) {
        session.flash('error', 'Member not found')
        return response.redirect('back')
      }

      if (member.role === 'owner') {
        session.flash('error', 'Cannot remove owner')
        return response.redirect('back')
      }

      await member.delete()
      session.flash('success', 'Member removed')
    } catch (error) {
      console.error('Remove member error:', error)
      session.flash('error', 'Failed to remove member')
    }

    return response.redirect('back')
  }

  public async rotateApiKey({ auth, response, session }: HttpContext) {
    const user = auth.user!
    try {
      const token = await User.accessTokens.create(user)
      const apiToken = token.value!.release()
      session.put('apiToken', apiToken)
      session.flash('success', 'New API key generated')
    } catch (error) {
      console.error('Rotate API key error:', error)
      session.flash('error', 'Failed to generate API key')
    }
    return response.redirect('back')
  }

  public async importHighlights({ auth, request, response, session }: HttpContext) {
    try {
      const result = await ImportHighlightsService.run(auth.user!, request)
      session.flash('success', result.message)
    } catch (err: any) {
      session.flash('error', err.message || 'Import failed')
    }
    return response.redirect('back')
  }
}
