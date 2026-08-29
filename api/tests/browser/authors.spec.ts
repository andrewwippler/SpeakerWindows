import { test } from '@japa/runner'
import IllustrationFactory from '#database/factories/illustration_factory'
import { loginUser } from './helpers.js'

test.group('Authors views (browser)', () => {
  test('index page renders heading', async ({ visit, browserContext }) => {
    await loginUser(browserContext)
    const page = await visit('/authors')
    await page.assertTextContains('h2', 'Authors')
  })

  test('index page shows authors from the users illustrations', async ({
    visit,
    browserContext,
  }) => {
    const { user } = await loginUser(browserContext)
    await IllustrationFactory.merge({
      title: 'Author Browser Story',
      author: 'Browser Author Name',
      user_id: user.id,
    }).create()

    const page = await visit('/authors')
    await page.assertTextContains('h2', 'Authors')
    await page.assertVisible(`a[href="/authors/Browser%20Author%20Name"]`)
  })

  test('show page renders illustrations by the author', async ({ visit, browserContext }) => {
    const { user } = await loginUser(browserContext)
    await IllustrationFactory.merge({
      title: 'By This Author',
      author: 'Show Browser Author',
      user_id: user.id,
    }).create()

    const page = await visit('/authors/Show%20Browser%20Author')
    await page.assertTextContains('h2', 'Show Browser Author')
    await page.assertTextContains('body', 'By This Author')
  })

  test('show page exposes an edit author button', async ({ visit, browserContext, assert }) => {
    const { user } = await loginUser(browserContext)
    const illustration = await IllustrationFactory.merge({
      title: 'Edit Author Story',
      author: 'Edit Author Name',
      user_id: user.id,
    }).create()

    const page = await visit('/authors/Edit%20Author%20Name')
    await page.assertVisible('button:has-text("Edit Author")')

    const link = page.locator(`button[onclick*="/authors/Edit%20Author%20Name/edit"]`)
    await link.click()
    await page.waitForURL(/\/authors\/.*\/edit$/)
    await page.assertTextContains('h2', 'Edit Author')
    assert.equal(illustration.id > 0, true)
  })

  test('editing an author renames its illustrations and redirects', async ({
    visit,
    browserContext,
    assert,
  }) => {
    const { user } = await loginUser(browserContext)
    const illustration = await IllustrationFactory.merge({
      title: 'Rename Author Story',
      author: 'Rename Author Old',
      user_id: user.id,
    }).create()

    const page = await visit('/authors/Rename%20Author%20Old/edit')
    await page.fill('input[name="name"]', 'Rename Author New')
    await page.click('button:has-text("Save")')
    await page.waitForURL(/\/authors\/Rename%20Author%20New$/)

    const updated = await Illustration.findOrFail(illustration.id)
    assert.equal(updated.author, 'Rename Author New')
    await page.assertTextContains('h2', 'Rename Author New')
  })
})
