import { test, expect } from './fixtures/auth.fixture'

test.describe('Search', () => {
  test('search page renders', async ({ loggedInPage: page }) => {
    await page.goto('/search')
    await expect(page.locator('input[name="query"], input[type="search"], input[placeholder*="earch"]')).toBeVisible()
  })

  test('search form exists with submit button', async ({ loggedInPage: page }) => {
    await page.goto('/search')
    await expect(page.locator('button[type="submit"], button:has-text("Search")')).toBeVisible()
  })
})
