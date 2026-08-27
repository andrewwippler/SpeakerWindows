import { test } from '@japa/runner'
import IllustrationFactory from '#database/factories/illustration_factory'
import TagFactory from '#database/factories/tag_factory'
import Tag from '#models/tag'
import { loginUser, uniqueEmail } from './helpers.js'

test.group('Tags views (browser)', () => {
  test('index page renders heading', async ({ visit, browserContext }) => {
    await loginUser(browserContext)
    const page = await visit('/tags')
    await page.assertTextContains('h2', 'Tags')
  })

  test('index page shows tags belonging to the user', async ({ visit, browserContext }) => {
    const { user } = await loginUser(browserContext)
    const created = await TagFactory.merge({ name: 'Browser Tag Index', user_id: user.id }).create()
    const tag = await Tag.findByOrFail('id', created.id)

    const page = await visit('/tags')
    await page.assertTextContains('h2', 'Tags')
    await page.assertVisible(`a[href="/tags/${tag.name}"]`)
  })

  test('show page renders illustrations under a tag', async ({ visit, browserContext }) => {
    const { user } = await loginUser(browserContext)
    const created = await TagFactory.merge({
      name: uniqueEmail('show-tag'),
      user_id: user.id,
    }).create()
    const tag = await Tag.findByOrFail('id', created.id)
    const illustration = await IllustrationFactory.merge({
      title: 'Illustrated Under A Tag',
      user_id: user.id,
    }).create()
    await illustration.related('tags').attach([tag.id])

    const page = await visit(`/tags/${encodeURIComponent(tag.name)}`)
    await page.assertTextContains('h2', 'Tag:')
    await page.assertTextContains('body', 'Illustrated Under A Tag')
  })
})
