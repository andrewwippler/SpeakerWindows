import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { LoginValidator } from '#validators/login_validator'
import { CreateUserValidator } from '#validators/create_user_validator'
import limiter from '@adonisjs/limiter/services/main'
import Team from '#models/team'
import TeamMember from '#models/team_member'
import crypto from 'node:crypto'

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const bytes = crypto.randomBytes(8)
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(bytes[i] % chars.length)
  }
  return code
}

export default class AuthController {
  public async showLogin({ view }: HttpContext) {
    return view.render('auth/login')
  }

  public async login({ auth, request, response, session, view }: HttpContext) {
    const { email, password } = request.all()

    try {
      await LoginValidator.validate({ email, password })
    } catch (error) {
      session.flash('errors', error.messages)
      session.flash('error', 'Invalid credentials format')
      return view.render('auth/login')
    }

    const throttleKey = `login_${email}_${request.ip()}`

    const locallimit = limiter.use({
      requests: 5,
      duration: '5 mins',
      blockDuration: '30 mins',
    })

    if (await locallimit.isBlocked(throttleKey)) {
      session.flash('error', 'Too many requests. Please wait 30 minutes and try again.')
      return view.render('auth/login')
    }

    try {
      const user = await User.verifyCredentials(email, password)
      await locallimit.delete(throttleKey)

      await auth.use('web').login(user)

      session.flash('success', 'Logged in successfully')
      return response.redirect('/')
    } catch (error) {
      await locallimit.increment(throttleKey)
      session.flash('error', 'Email or password is incorrect')
      return view.render('auth/login')
    }
  }

  public async showRegister({ view }: HttpContext) {
    return view.render('auth/register')
  }

  public async register({ auth, request, response, session, view }: HttpContext) {
    const { email, password, password_confirmation: passwordConfirmation } = request.all()

    try {
      await CreateUserValidator.validate({
        email,
        password,
        password_confirmation: passwordConfirmation,
      })
    } catch (error) {
      session.flash('errors', error.messages)
      session.flash('error', 'Registration validation failed')
      return view.render('auth/register')
    }

    try {
      const user = await User.create({ email, password })

      const team = await Team.create({
        inviteCode: generateInviteCode(),
        name: 'My Team',
        userId: user.id,
      })

      await TeamMember.create({
        teamId: team.id,
        userId: user.id,
        role: 'owner',
      })

      await auth.use('web').login(user)

      session.flash('success', 'Account created successfully')
      return response.redirect('/')
    } catch (error) {
      session.flash('error', 'Failed to create account. Email may already be in use.')
      return view.render('auth/register')
    }
  }

  public async logout({ auth, response, session }: HttpContext) {
    try {
      await auth.use('web').logout()
      session.flash('success', 'Logged out successfully')
    } catch {
      session.flash('error', 'Failed to log out')
    }
    return response.redirect('/login')
  }
}
