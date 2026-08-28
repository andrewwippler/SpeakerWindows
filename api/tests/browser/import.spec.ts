import { test } from '@japa/runner'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import IllustrationFactory from '#database/factories/illustration_factory'
import Illustration from '#models/illustration'
import { loginUser } from './helpers.js'

const dirname = fileURLToPath(import.meta.url)
  .split('/')
  .slice(0, -2)
  .join('/')
const assetsDir = join(dirname, 'assets', 'import')

test.group('Import highlights views (browser)', () => {
  test('import tab renders source select, file input and submit button', async ({
    visit,
    browserContext,
  }) => {
    await loginUser(browserContext)
    const page = await visit('/settings')
    await page.click('#tab-import')
    await page.assertVisible('select[name="importer"]')
    await page.assertVisible('input[type="file"][name="file"]')
    await page.assertVisible('form[action="/settings/import"] button[type="submit"]')
  })

  test('import select offers all supported highlight sources', async ({
    visit,
    browserContext,
    assert,
  }) => {
    await loginUser(browserContext)
    const page = await visit('/settings')
    await page.click('#tab-import')

    const options = await page.locator('select[name="importer"] option').allTextContents()
    assert.equal(options.length, 4)
  })

  test('imports a Readwise CSV and creates illustrations', async ({
    visit,
    browserContext,
    assert,
  }) => {
    const { user } = await loginUser(browserContext)
    const before = await Illustration.query().where('user_id', user.id)

    const page = await visit('/settings')
    await page.click('#tab-import')
    await page.selectOption('select[name="importer"]', 'readwise')
    await page.setInputFiles(
      'input[type="file"][name="file"]',
      join(assetsDir, 'test_readwise.csv')
    )
    await page.click('form[action="/settings/import"] button[type="submit"]')
    await page.waitForURL('/settings')

    const after = await Illustration.query().where('user_id', user.id)
    assert.equal(after.length, before.length + 2)
  })

  test('imports a KOReader JSON and creates illustrations', async ({
    visit,
    browserContext,
    assert,
  }) => {
    const { user } = await loginUser(browserContext)
    const before = await Illustration.query().where('user_id', user.id)

    const page = await visit('/settings')
    await page.click('#tab-import')
    await page.selectOption('select[name="importer"]', 'koreader')
    await page.setInputFiles(
      'input[type="file"][name="file"]',
      join(assetsDir, 'test_koreader.json')
    )
    await page.click('form[action="/settings/import"] button[type="submit"]')
    await page.waitForURL('/settings')

    const after = await Illustration.query().where('user_id', user.id)
    assert.equal(after.length, before.length + 2)
  })

  test('imports a Play Books HTML and creates illustrations', async ({
    visit,
    browserContext,
    assert,
  }) => {
    const { user } = await loginUser(browserContext)
    const before = await Illustration.query().where('user_id', user.id)

    const page = await visit('/settings')
    await page.click('#tab-import')
    await page.selectOption('select[name="importer"]', 'playbooks')
    await page.setInputFiles(
      'input[type="file"][name="file"]',
      join(assetsDir, 'test_playbooks.html')
    )
    await page.click('form[action="/settings/import"] button[type="submit"]')
    await page.waitForURL('/settings')

    const after = await Illustration.query().where('user_id', user.id)
    assert.equal(after.length, before.length + 2)
  })

  test('importing a duplicate Readwise CSV reports duplicates', async ({
    visit,
    browserContext,
    assert,
  }) => {
    const { user } = await loginUser(browserContext)
    const before = await Illustration.query().where('user_id', user.id)

    const page = await visit('/settings')
    await page.click('#tab-import')
    await page.selectOption('select[name="importer"]', 'readwise')
    await page.setInputFiles(
      'input[type="file"][name="file"]',
      join(assetsDir, 'test_readwise.csv')
    )
    await page.click('form[action="/settings/import"] button[type="submit"]')
    await page.waitForURL('/settings')

    const firstAfter = await Illustration.query().where('user_id', user.id)
    assert.equal(firstAfter.length, before.length + 2)

    // Re-import the same file -> duplicates, no new illustrations
    await page.click('#tab-import')
    await page.selectOption('select[name="importer"]', 'readwise')
    await page.setInputFiles(
      'input[type="file"][name="file"]',
      join(assetsDir, 'test_readwise.csv')
    )
    await page.click('form[action="/settings/import"] button[type="submit"]')
    await page.waitForURL('/settings')

    const secondAfter = await Illustration.query().where('user_id', user.id)
    assert.equal(secondAfter.length, firstAfter.length)
  })
})
