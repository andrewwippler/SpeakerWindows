import { test } from '@japa/runner'
import { loginUser } from './helpers.js'

test.group('Search & Articles views (browser)', () => {
  test('search page renders with query form', async ({ visit, browserContext }) => {
    await loginUser(browserContext)
    const page = await visit('/search')
    await page.assertTextContains('h2', 'Search')
    await page.assertVisible('input[name="query"]')
    await page.assertVisible('button[type="submit"]')
  })

  test('articles page renders recent view empty state', async ({ visit, browserContext }) => {
    await loginUser(browserContext)
    const page = await visit('/articles')
    await page.assertTextContains('h2', 'Recently Viewed')
  })
})
