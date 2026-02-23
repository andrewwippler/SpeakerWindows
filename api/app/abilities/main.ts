/*
|--------------------------------------------------------------------------
| Bouncer abilities
|--------------------------------------------------------------------------
|
| You may export multiple abilities from this file and pre-register them
| when creating the Bouncer instance.
|
| Pre-registered policies and abilities can be referenced as a string by their
| name. Also they are must if want to perform authorization inside Edge
| templates.
|
*/

import { Bouncer } from '@adonisjs/bouncer'
import User from '#models/user'
import Tag from '#models/tag'
import _ from 'lodash'
import Illustration from '#models/illustration'
import Place from '#models/place'
import TeamMember from '#models/team_member'
import Team from '#models/team'
import type { TeamRole } from '#models/team'

async function getUserRoleInTeam(user: User, teamId: number): Promise<TeamRole | null> {
  const membership = await TeamMember.query()
    .where('team_id', teamId)
    .where('user_id', user.id)
    .first()
  return membership?.role || null
}

export const editUser = Bouncer.ability(() => {
  return true
})

export const editTag = Bouncer.ability(async (user: User, tag: Tag) => {
  // get team id from tag
  if (tag.team_id) {
    const roleAllow = await getUserRoleInTeam(user, tag.team_id).then((role) => {
      return role && ['owner', 'creator', 'editor'].includes(role)
    })
    return roleAllow || false
  }
  return _.toInteger(user.id) === _.toInteger(tag.user_id)
})

export const viewPlace = Bouncer.ability((user: User, place: Place) => {
  return _.toInteger(user.id) === _.toInteger(place.user_id)
})

export async function canEditIllustration(
  user: User,
  illustration: Illustration
): Promise<boolean> {
  if (_.toInteger(user.id) === _.toInteger(illustration.user_id)) {
    return true
  }

  if (illustration.team_id) {
    const role = await getUserRoleInTeam(user, illustration.team_id)
    if (role && ['owner', 'creator', 'editor'].includes(role)) {
      return true
    }
  }

  return false
}

export async function canEditIllustrationContent(
  user: User,
  illustration: Illustration
): Promise<boolean> {
  if (_.toInteger(user.id) === _.toInteger(illustration.user_id)) {
    return true
  }

  if (illustration.team_id) {
    const role = await getUserRoleInTeam(user, illustration.team_id)
    if (role && ['owner', 'creator'].includes(role)) {
      return true
    }
  }

  return false
}

export async function canDeleteIllustration(
  user: User,
  illustration: Illustration
): Promise<boolean> {
  if (_.toInteger(user.id) === _.toInteger(illustration.user_id)) {
    return true
  }

  if (illustration.team_id) {
    const role = await getUserRoleInTeam(user, illustration.team_id)
    if (role && ['owner', 'creator'].includes(role)) {
      return true
    }
  }

  return false
}

export async function canViewIllustration(
  user: User,
  illustration: Illustration
): Promise<boolean> {
  if (_.toInteger(user.id) === _.toInteger(illustration.user_id)) {
    return true
  }

  if (illustration.private) {
    return false
  }

  if (illustration.team_id) {
    const role = await getUserRoleInTeam(user, illustration.team_id)
    if (role && ['owner', 'creator', 'editor', 'readonly'].includes(role)) {
      return true
    }
  }

  return false
}
