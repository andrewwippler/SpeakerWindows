import { test, expect } from './fixtures/auth.fixture.js'

test.describe('Settings', () => {
  test('settings page renders', async ({ loggedInPage: page }) => {
    await page.goto('/settings')
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  })

  test('settings has account form', async ({ loggedInPage: page }) => {
    await page.goto('/settings')
    await expect(
      page.getByRole('tabpanel', { name: 'Account' }).getByRole('textbox', { name: 'Email' })
    ).toBeVisible()
  })

  test('settings page has tabs', async ({ loggedInPage: page }) => {
    await page.goto('/settings')
    await expect(page.locator('ot-tabs')).toBeVisible()
  })
})
