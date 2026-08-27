import User from '#models/user'
import UserFactory from '#database/factories/user_factory'

export const PASSWORD = 'SecurePass123!'

let counter = 0
export function uniqueEmail(prefix: string) {
  counter += 1
  return `${prefix}-${Date.now()}-${counter}-${Math.floor(Math.random() * 1e6)}@example.com`
}

/**
 * Create a user via factory and authenticate them for the whole
 * browser context using the AdonisJS `loginAs` helper.
 */
export async function loginUser(browserContext: any, prefix = 'browser-user') {
  const user = await UserFactory.merge({ password: PASSWORD }).create()
  await browserContext.loginAs(user)
  return { user }
}

/**
 * Register a brand new user through the UI (used to exercise the
 * registration flow) and return the authenticated page, the email used
 * and the registered User model.
 */
export async function registerUser(visit: any, prefix = 'browser-user') {
  const email = uniqueEmail(prefix)
  const page = await visit('/register')
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', PASSWORD)
  await page.fill('input[name="password_confirmation"]', PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('/')
  const user = await User.findByOrFail('email', email)
  return { page, email, user }
}
