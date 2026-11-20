import TeamMember from '#models/team_member'
import type { TeamRole } from '#models/team'
import User from '#models/user'
import { generateTemporaryPassword } from '#services/temporary_password_service'

export type AddTeamMemberResult = {
  user: User
  membership: TeamMember
  temporaryPassword: string | null
}

export async function addTeamMemberByEmail(
  teamId: number,
  email: string,
  role: TeamRole
): Promise<AddTeamMemberResult> {
  const normalizedEmail = email.trim().toLowerCase()
  let user = await User.query().whereRaw('LOWER(email) = ?', [normalizedEmail]).first()
  let temporaryPassword: string | null = null

  if (!user) {
    temporaryPassword = generateTemporaryPassword()
    user = await User.create({
      email: normalizedEmail,
      password: temporaryPassword,
      mustChangePassword: true,
    })
  }

  const membership = await TeamMember.create({
    teamId,
    userId: user.id,
    role,
  })

  return { user, membership, temporaryPassword }
}
