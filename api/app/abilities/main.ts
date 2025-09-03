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

/**
 * Delete the following ability to start from
 * scratch
 */
export const editUser = Bouncer.ability(() => {
  return true
})

export const editTag = Bouncer.ability((user: User, tag: Tag) => {
  return __.toInteger(user.id) === _.toInteger(tag.user_id)
})

export const editIllustration = Bouncer.ability((user: User, illustration: Illustration) => {
  return _.toInteger(user.id) === _.toInteger(illustration.user_id)
})

export const viewPlace = Bouncer.ability((user: User, place: Place) => {
  return _.toInteger(user.id) === _.toInteger(place.user_id)
})
