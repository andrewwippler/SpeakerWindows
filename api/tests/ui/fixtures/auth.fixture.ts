import { test as base, type Page } from '@playwright/test'

export const TEST_USER = {
  email: `test-${Date.now()}@example.com`,
  password: 'SecurePass123!',
}

export async function registerUser(
  page: Page,
  email = TEST_USER.email,
  password = TEST_USER.password
) {
  await page.goto('/register')
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.fill('input[name="password_confirmation"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/')
}

export async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
}

export const test = base.extend<{ loggedInPage: Page }>({
  loggedInPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const email = `ui-${Date.now()}@example.com`
    await registerUser(page, email)
    await use(page)
    await context.close()
  },
})

export { expect } from '@playwright/test'
