import { test, expect, registerUser } from './fixtures/auth.fixture'

test.describe('Illustrations', () => {
  test('illustrations page renders for authenticated user', async ({ loggedInPage: page }) => {
    await page.goto('/illustrations')
    await expect(page.locator('h1')).toContainText('Illustrations')
  })

  test('new illustration form renders', async ({ loggedInPage: page }) => {
    await page.goto('/illustrations/new')
    await expect(page.locator('h1')).toContainText('New Illustration')
    await expect(page.locator('input[name="title"]')).toBeVisible()
    await expect(page.locator('input[name="author"]')).toBeVisible()
  })

  test('illustration detail page renders', async ({ loggedInPage: page }) => {
    // First check illustrations list exists, then navigate to first one if available
    await page.goto('/illustrations')
    const links = page.locator('a[href^="/illustrations/"]')
    const count = await links.count()
    if (count > 0) {
      await links.first().click()
      await expect(page.locator('h1, h2').first()).toBeVisible()
    }
  })
})
