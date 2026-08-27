import { test } from '@japa/runner'
import { loginUser } from './helpers.js'

test.group('Settings views (browser)', () => {
  test('settings page renders with defaults form and illustration count', async ({
    visit,
    browserContext,
  }) => {
    await loginUser(browserContext)
    const page = await visit('/settings')
    await page.assertTextContains('h2', 'Settings')
    await page.click('#tab-defaults')
    await page.assertVisible('input[name="place"]')
    await page.assertVisible('input[name="location"]')
  })

  test('saves default place and location', async ({ visit, browserContext }) => {
    await loginUser(browserContext)
    const page = await visit('/settings')
    await page.click('#tab-defaults')
    await page.fill('input[name="place"]', 'Home Office')
    await page.fill('input[name="location"]', 'Portland, OR')
    await page.click('button[type="submit"]')
    await page.assertPath('/settings')
    await page.assertTextContains('body', 'Settings saved!')
  })
})
