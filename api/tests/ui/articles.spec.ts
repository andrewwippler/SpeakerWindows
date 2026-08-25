import { test, expect } from './fixtures/auth.fixture'

test.describe('Articles (Recently Viewed)', () => {
  test('articles page renders', async ({ loggedInPage: page }) => {
    await page.goto('/articles')
    await expect(page.locator('h1')).toContainText('Recently Viewed')
  })
})
