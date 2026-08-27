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
})
