import { test, expect } from './fixtures/auth.fixture'

test.describe('Tags', () => {
  test('tags page renders', async ({ loggedInPage: page }) => {
    await page.goto('/tags')
    await expect(page.locator('h1')).toContainText('Tags')
  })
})
