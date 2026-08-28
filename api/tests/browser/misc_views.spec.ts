import { test } from '@japa/runner'
import TeamInvitation from '#models/team_invitation'
import TeamFactory from '#database/factories/team_factory'
import { loginUser } from './helpers.js'

test.group('Misc edge views (browser)', () => {
  test('dashboard renders the tags landing page', async ({ visit, browserContext }) => {
    await loginUser(browserContext)
    const page = await visit('/')
    await page.assertTextContains('h2', 'Tags')
  })

  test('help index renders with links to help sections', async ({ visit, browserContext }) => {
    await loginUser(browserContext)
    const page = await visit('/help')
    await page.assertTextContains('h2', 'Help')
    await page.assertVisible('a[href="/help/search"]')
    await page.assertVisible('a[href="/help/create"]')
    await page.assertVisible('a[href="/help/import"]')
  })

  test('help search/create/import pages render', async ({ visit, browserContext }) => {
    await loginUser(browserContext)
    for (const path of ['/help/search', '/help/create', '/help/import']) {
      const page = await visit(path)
      await page.assertTextContains('body', 'Back to Help')
    }
  })

  test('tos page renders', async ({ visit, browserContext }) => {
    await loginUser(browserContext)
    const page = await visit('/tos')
    await page.assertTextContains('body', 'Terms')
  })

  test('privacy page renders', async ({ visit, browserContext }) => {
    await loginUser(browserContext)
    const page = await visit('/privacy-policy')
    await page.assertTextContains('body', 'Privacy')
  })

  test('contact page renders the contact form', async ({ visit, browserContext }) => {
    await loginUser(browserContext)
    const page = await visit('/contact')
    await page.assertTextContains('h2', 'Contact Us')
    await page.assertVisible('input[name="name"]')
    await page.assertVisible('input[name="email"]')
    await page.assertVisible('input[name="subject"]')
    await page.assertVisible('textarea[name="message"]')
  })

  test('contact form submission shows a success flash', async ({ visit, browserContext }) => {
    await loginUser(browserContext)
    const page = await visit('/contact')
    await page.fill('input[name="name"]', 'Browser Tester')
    await page.fill('input[name="email"]', 'tester@example.com')
    await page.fill('input[name="subject"]', 'Hello')
    await page.fill('textarea[name="message"]', 'This is a test message.')
    await page.click('button[type="submit"]')
    await page.assertPath('/contact')
    await page.assertTextContains('body', 'Message sent!')
  })

  test('invitations page renders empty state', async ({ visit, browserContext }) => {
    await loginUser(browserContext)
    const page = await visit('/invitations')
    await page.assertTextContains('h2', 'Invitations')
    await page.assertTextContains('body', 'No pending invitations.')
  })

  test('invitations page shows pending invitations', async ({ visit, browserContext }) => {
    const { user } = await loginUser(browserContext)
    const team = await TeamFactory.merge({ user_id: user.id }).create()
    await TeamInvitation.create({
      userId: user.id,
      teamId: team.id,
      role: 'creator',
      status: 'pending',
    })

    const page = await visit('/invitations')
    await page.assertTextContains('h2', 'Invitations')
    await page.assertVisible('button:has-text("Accept")')
    await page.assertVisible('button:has-text("Decline")')
  })
})
