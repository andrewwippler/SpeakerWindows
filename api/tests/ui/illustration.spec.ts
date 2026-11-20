import { test, expect } from './fixtures/auth.fixture.js'

test.describe('Illustrations', () => {
  test('illustrations page renders for authenticated user', async ({ loggedInPage: page }) => {
    await page.goto('/illustrations')
    await expect(page.getByRole('heading', { name: 'Illustrations' })).toBeVisible()
  })

  test('new illustration form renders', async ({ loggedInPage: page }) => {
    await page.goto('/illustrations/new')
    await expect(page.getByRole('heading', { name: 'New Illustration' })).toBeVisible()
    await expect(page.locator('input[name="title"]')).toBeVisible()
    await expect(page.locator('input[name="author"]')).toBeVisible()
  })

  test('illustration detail page renders', async ({ loggedInPage: page }) => {
    await page.goto('/illustrations')
    const links = page.locator('#results a[href^="/illustrations/"]')
    const count = await links.count()
    if (count > 0) {
      await links.first().click()
      await expect(page.getByRole('heading').first()).toBeVisible()
    }
  })
})
