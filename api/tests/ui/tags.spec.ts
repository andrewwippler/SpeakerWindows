import { test, expect } from './fixtures/auth.fixture.js'

test.describe('Tags', () => {
  test('tags page renders', async ({ loggedInPage: page }) => {
    await page.goto('/tags')
    await expect(page.getByRole('heading', { name: 'Tags' })).toBeVisible()
  })
})
