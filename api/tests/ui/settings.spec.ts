import { test, expect } from './fixtures/auth.fixture'

test.describe('Settings', () => {
  test('settings page renders', async ({ loggedInPage: page }) => {
    await page.goto('/settings')
    await expect(page.locator('h1')).toContainText('Settings')
  })

  test('settings has account form', async ({ loggedInPage: page }) => {
    await page.goto('/settings')
    await expect(page.locator('input[name="email"]')).toBeVisible()
  })

  test('settings page has tabs', async ({ loggedInPage: page }) => {
    await page.goto('/settings')
    await expect(page.locator('ot-tabs')).toBeVisible()
  })
})
