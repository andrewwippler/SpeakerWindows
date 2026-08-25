import { test, expect, registerUser, loginUser, TEST_USER } from './fixtures/auth.fixture'

test.describe('Authentication', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h1')).toContainText('Sign in to SpeakerWindows')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toContainText('Sign In')
  })

  test('register page renders correctly', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('h1')).toContainText('Create an account')
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('input[name="password_confirmation"]')).toBeVisible()
  })

  test('registration creates account and redirects to home', async ({ page }) => {
    const email = `reg-${Date.now()}@example.com`
    await registerUser(page, email)
    await expect(page).toHaveURL('/')
  })

  test('login with valid credentials redirects to home', async ({ page }) => {
    const email = `login-${Date.now()}@example.com`
    await registerUser(page, email)
    await page.goto('/logout')
    await loginUser(page, email, TEST_USER.password)
    await expect(page).toHaveURL('/')
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'wrong@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/login')
    await expect(page.locator('.ot-alert-error')).toBeVisible()
  })

  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/settings')
    await expect(page).toHaveURL('/login')
  })

  test('login page has link to register', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('a[href="/register"]')).toBeVisible()
  })

  test('register page has link to login', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('a[href="/login"]')).toBeVisible()
  })

  test('logout redirects to login', async ({ page }) => {
    const email = `logout-${Date.now()}@example.com`
    await registerUser(page, email)
    await page.goto('/logout')
    await expect(page).toHaveURL('/login')
  })
})
