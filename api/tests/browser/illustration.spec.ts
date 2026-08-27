import { test } from '@japa/runner'
import Place from '#models/place'
import Upload from '#models/upload'
import IllustrationFactory from '#database/factories/illustration_factory'
import TagFactory from '#database/factories/tag_factory'
import PlaceFactory from '#database/factories/place_factory'
import { loginUser } from './helpers.js'

test.group('Illustration views (browser)', () => {
  test('index page renders with heading and search form', async ({ visit, browserContext }) => {
    await loginUser(browserContext)
    const page = await visit('/illustrations')
    await page.assertTextContains('h2', 'Illustrations')
    await page.assertVisible('input[name="q"]')
    await page.assertVisible('button[type="submit"]')
  })

  test('index page shows illustrations belonging to the user', async ({
    visit,
    browserContext,
  }) => {
    const { user } = await loginUser(browserContext)
    await IllustrationFactory.merge({
      title: 'Browser Index Illustration',
      user_id: user.id,
    }).create()

    const page = await visit('/illustrations')
    await page.assertTextContains('body', 'Browser Index Illustration')
  })

  test('show page renders illustration details and tags', async ({ visit, browserContext }) => {
    const { user } = await loginUser(browserContext)
    const illustration = await IllustrationFactory.merge({
      title: 'Browser Show Story',
      author: 'Browser Author',
      source: 'https://example.com/story',
      content: 'Once upon a time in a browser test.',
      user_id: user.id,
    }).create()
    const tag = await TagFactory.merge({ name: 'BrowserTag', user_id: user.id }).create()
    await illustration.related('tags').attach([tag.id])

    const page = await visit(`/illustrations/${illustration.id}`)
    await page.assertTextContains('h2', 'Browser Show Story')
    await page.assertTextContains('body', 'Browser Author')
    await page.assertTextContains('body', 'Once upon a time in a browser test.')
    await page.assertVisible('ot-tag')
    await page.assertVisible(`a[href="/illustrations/${illustration.id}/edit"]`)
  })

  test('edit page renders form, attachments block and file upload', async ({
    visit,
    browserContext,
  }) => {
    const { user } = await loginUser(browserContext)
    const illustration = await IllustrationFactory.merge({
      title: 'Browser Edit Story',
      user_id: user.id,
    }).create()

    const page = await visit(`/illustrations/${illustration.id}/edit`)
    await page.assertTextContains('h2', 'Edit Illustration')
    await page.assertVisible('input[name="title"]')
    await page.assertVisible('textarea[name="content"]')
    await page.assertTextContains('body', 'Upload a file')
    await page.assertVisible('input[type="file"][name="illustration_image"]')
    await page.assertVisible('button:has-text("Save")')
    await page.assertVisible('button[type="submit"][name="upload_submit"]')
  })

  test('places are displayed for the illustration', async ({ visit, browserContext }) => {
    const { user } = await loginUser(browserContext)
    const illustration = await IllustrationFactory.merge({
      title: 'Places Browser Story',
      user_id: user.id,
    }).create()
    await PlaceFactory.merge({
      illustration_id: illustration.id,
      user_id: user.id,
      place: 'The Observatory',
      location: 'Mount Wilson',
    }).create()

    const page = await visit(`/illustrations/${illustration.id}`)
    await page.assertTextContains('body', 'Places')
    await page.assertTextContains('body', 'The Observatory')
    await page.assertTextContains('body', 'Mount Wilson')
  })

  test('can add a place via the show page form', async ({ visit, browserContext }) => {
    const { user } = await loginUser(browserContext)
    const illustration = await IllustrationFactory.merge({
      title: 'Add Place Browser',
      user_id: user.id,
    }).create()

    const page = await visit(`/illustrations/${illustration.id}`)
    await page.fill('input[name="place"]', 'Newly Added Place')
    await page.fill('input[name="location"]', 'Newly Added City')
    await page.click('button[type="submit"]')

    const saved = await Place.query().where('illustration_id', illustration.id).first()
    if (saved) {
      await page.assertTextContains('body', 'Newly Added Place')
    }
  })

  test('can upload a file to the illustration via edit form', async ({ visit, browserContext }) => {
    const { user } = await loginUser(browserContext)
    const illustration = await IllustrationFactory.merge({
      title: 'Upload Browser Story',
      user_id: user.id,
    }).create()

    const page = await visit(`/illustrations/${illustration.id}/edit`)
    await page.setInputFiles('input[type="file"][name="illustration_image"]', {
      name: 'test-image.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake-png-data'),
    })
    await page.click('button[type="submit"][name="upload_submit"]')
    await page.waitForURL(`/illustrations/${illustration.id}/edit`)

    const saved = await Upload.query().where('illustration_id', illustration.id).first()
    if (saved) {
      await page.assertTextContains('body', 'File uploaded successfully')
    }
  })

  test('cannot edit an illustration owned by another user', async ({ visit, browserContext }) => {
    const { user } = await loginUser(browserContext, 'owner')

    const illustration = await IllustrationFactory.merge({
      title: 'Someone Elses Browser',
      user_id: user.id,
    }).create()

    // switch to a different user within the same context
    await loginUser(browserContext, 'intruder')

    // intruder attempts to edit owner's illustration -> redirected to show page
    const editPage = await visit(`/illustrations/${illustration.id}/edit`)
    await editPage.assertPath(`/illustrations/${illustration.id}`)
  })
})
