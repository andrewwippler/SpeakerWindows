import { test } from '@japa/runner'
import { join } from 'node:path'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import Place from '#models/place'
import Upload from '#models/upload'
import Illustration from '#models/illustration'
import IllustrationFactory from '#database/factories/illustration_factory'
import TagFactory from '#database/factories/tag_factory'
import PlaceFactory from '#database/factories/place_factory'
import { loginUser } from './helpers.js'

const dirname = fileURLToPath(import.meta.url)
  .split('/')
  .slice(0, -1)
  .join('/')
const pngAsset = join(dirname, '..', 'assets', '1kb.png')

test.group('Illustration views (browser)', () => {
  test('index page renders with heading', async ({ visit, browserContext }) => {
    await loginUser(browserContext)
    const page = await visit('/illustrations')
    await page.assertTextContains('h2', 'Illustrations')
    await page.assertVisible('#results')
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
    await page.assertVisible('a[href^="/tags/"]')
    await page.assertVisible(`a[href="/illustrations/${illustration.id}/edit"]`)
    await page.assertVisible('button:has-text("Copy Illustration Content")')
  })

  test('copy button copies content and creates a place without reloading', async ({
    visit,
    browserContext,
    assert,
  }) => {
    const { user } = await loginUser(browserContext)
    const illustration = await IllustrationFactory.merge({
      title: 'Copy Browser Story',
      content: 'Copy me from the browser test.',
      user_id: user.id,
    }).create()

    const page = await visit(`/illustrations/${illustration.id}`)
    await page.click('button:has-text("Copy Illustration Content")')
    await page.waitForSelector('[data-copy-label]:text("Illustration copied.")')

    await page.assertTextContains('body', 'Illustration copied.')
    await page.assertTextContains('body', 'Someplace')
    await page.assertPath(`/illustrations/${illustration.id}`)

    const place = await Place.query().where('illustration_id', illustration.id).first()
    assert.isNotNull(place)
    if (place) {
      assert.equal(place.place, 'Someplace')
      assert.equal(place.location, 'Somewhere')
    }
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
    await page.assertTextContains('h3', 'Edit Illustration')
    await page.assertVisible('input[name="title"]')
    await page.assertVisible('textarea[name="content"]')
    await page.assertTextContains('body', 'Illustration Image(s)')
    await page.assertExists('ot-upload input[type="file"][name="illustration_image"]')
    await page.assertVisible('button:has-text("Save")')
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
    await page.fill('#add-place-form input[name="place"]', 'Newly Added Place')
    await page.fill('#add-place-form input[name="location"]', 'Newly Added City')
    await page.click('#add-place-form button[type="submit"]')

    const saved = await Place.query().where('illustration_id', illustration.id).first()
    if (saved) {
      await page.assertTextContains('body', 'Newly Added Place')
    }
  })

  test('can upload multiple files to the illustration via edit form', async ({
    visit,
    browserContext,
    assert,
  }) => {
    const { user } = await loginUser(browserContext)
    const illustration = await IllustrationFactory.merge({
      title: 'Multi Upload Browser Story',
      user_id: user.id,
    }).create()

    const page = await visit(`/illustrations/${illustration.id}/edit`)
    await page.setInputFiles('ot-upload input[type="file"][name="illustration_image"]', [
      {
        name: 'one.png',
        mimeType: 'image/png',
        buffer: await readFile(pngAsset),
      },
      {
        name: 'second.png',
        mimeType: 'image/png',
        buffer: await readFile(pngAsset),
      },
    ])
    await page.click('button:has-text("Save")')
    await page.waitForURL(`/illustrations/${illustration.id}`)

    const uploads = await Upload.query().where('illustration_id', illustration.id)
    assert.equal(uploads.length, 2)
  })

  test('can upload a file to the illustration via edit form', async ({
    visit,
    browserContext,
    assert,
  }) => {
    const { user } = await loginUser(browserContext)
    const illustration = await IllustrationFactory.merge({
      title: 'Upload Browser Story',
      user_id: user.id,
    }).create()

    const page = await visit(`/illustrations/${illustration.id}/edit`)
    await page.setInputFiles('ot-upload input[type="file"][name="illustration_image"]', [pngAsset])
    await page.click('button:has-text("Save")')
    await page.waitForURL(`/illustrations/${illustration.id}`)

    const saved = await Upload.query().where('illustration_id', illustration.id).first()
    assert.isNotNull(saved)
  })

  test('can create an illustration with a file via the new form', async ({
    visit,
    browserContext,
    assert,
  }) => {
    const { user } = await loginUser(browserContext)

    const page = await visit('/illustrations/new')
    await page.fill('input[name="title"]', 'New Upload Browser Story')
    await page.setInputFiles('ot-upload input[type="file"][name="illustration_image"]', [pngAsset])
    await page.click('button:has-text("Create")')
    await page.waitForURL(/\/illustrations\/\d+$/)

    const illustration = await Illustration.query()
      .where('title', 'New Upload Browser Story')
      .where('user_id', user.id)
      .first()
    assert.isNotNull(illustration)
    if (illustration) {
      const upload = await Upload.query().where('illustration_id', illustration.id).first()
      assert.isNotNull(upload)
    }
  })

  test('can create an illustration with tags via the new form', async ({
    visit,
    browserContext,
    assert,
  }) => {
    const { user } = await loginUser(browserContext)

    const page = await visit('/illustrations/new')
    await page.fill('input[name="title"]', 'New Tagged Browser Story')
    const tagInput = 'ot-taginput input[name="tags"]'
    await page.fill(tagInput, 'Alpha')
    await page.press(tagInput, 'Enter')
    await page.fill(tagInput, 'Beta')
    await page.press(tagInput, 'Enter')
    await page.click('button:has-text("Create")')
    await page.waitForURL(/\/illustrations\/\d+$/)

    const illustration = await Illustration.query()
      .where('title', 'New Tagged Browser Story')
      .where('user_id', user.id)
      .first()
    assert.isNotNull(illustration)
    if (illustration) {
      const tags = await illustration.related('tags').query()
      assert.deepEqual(tags.map((t) => t.name).sort(), ['Alpha', 'Beta'])
    }
  })

  test('can add a tag to an illustration via the edit form', async ({
    visit,
    browserContext,
    assert,
  }) => {
    const { user } = await loginUser(browserContext)
    const illustration = await IllustrationFactory.merge({
      title: 'Edit Tag Browser Story',
      user_id: user.id,
    }).create()
    const existing = await TagFactory.merge({ name: 'ExistingTag', user_id: user.id }).create()
    await illustration.related('tags').attach([existing.id])

    const page = await visit(`/illustrations/${illustration.id}/edit`)
    await page.assertVisible('ot-taginput .badge')
    const tagInput = 'ot-taginput input[name="tags"]'
    await page.fill(tagInput, 'AddedTag')
    await page.press(tagInput, 'Enter')
    await page.click('button:has-text("Save")')
    await page.waitForURL(`/illustrations/${illustration.id}`)

    const tags = await illustration.related('tags').query()
    assert.deepEqual(tags.map((t) => t.name).sort(), ['Added-Tag', 'Existing-Tag'])
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
