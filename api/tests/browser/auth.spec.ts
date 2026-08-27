import { test } from '@japa/runner'

test.group('Auth - login/register/logout (view routes)', () => {
  test('login page renders with email, password and submit', async ({ visit }) => {
    const page = await visit('/login')
    await page.assertVisible('input[type="email"]')
    await page.assertVisible('input[type="password"]')
    await page.assertTextContains('button[type="submit"]', 'Sign In')
  })

  test('register page renders with confirmation field', async ({ visit }) => {
    const page = await visit('/register')
    await page.assertVisible('input[name="email"]')
    await page.assertVisible('input[name="password"]')
    await page.assertVisible('input[name="password_confirmation"]')
    await page.assertTextContains('button[type="submit"]', 'Create Account')
  })

  test('registration creates an account and redirects to home', async ({ visit }) => {
    const email = `browser-reg-${Date.now()}@example.com`
    const page = await visit('/register')
    await page.fill('input[name="email"]', email)
    await page.fill('input[name="password"]', 'SecurePass123!')
    await page.fill('input[name="password_confirmation"]', 'SecurePass123!')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
    await page.assertPath('/')
  })

  test('login redirects to home for a registered user', async ({ visit }) => {
    const email = `browser-login-${Date.now()}@example.com`
    let page = await visit('/register')
    await page.fill('input[name="email"]', email)
    await page.fill('input[name="password"]', 'SecurePass123!')
    await page.fill('input[name="password_confirmation"]', 'SecurePass123!')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')

    page = await visit('/logout')

    page = await visit('/login')
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', 'SecurePass123!')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
    await page.assertPath('/')
  })

  test('login with invalid credentials does not authenticate', async ({ visit }) => {
    const page = await visit('/login')
    await page.fill('input[type="email"]', 'nobody@example.com')
    await page.fill('input[type="password"]', 'WrongPass123!')
    await page.click('button[type="submit"]')
    await page.waitForLoadState('networkidle')
    await page.assertPath('/login')

    const afterLogout = await visit('/logout')
    await afterLogout.assertPath('/login')
    await afterLogout.assertVisible('input[type="email"]')
  })

  test('logout redirects to login', async ({ visit }) => {
    const email = `browser-out-${Date.now()}@example.com`
    let page = await visit('/register')
    await page.fill('input[name="email"]', email)
    await page.fill('input[name="password"]', 'SecurePass123!')
    await page.fill('input[name="password_confirmation"]', 'SecurePass123!')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')

    page = await visit('/logout')
    await page.waitForURL('/login')
    await page.assertPath('/login')
  })

  test('login page links to register and vice versa', async ({ visit }) => {
    const loginPage = await visit('/login')
    await loginPage.assertVisible('a[href="/register"]')
    const registerPage = await visit('/register')
    await registerPage.assertVisible('a[href="/login"]')
  })
})
