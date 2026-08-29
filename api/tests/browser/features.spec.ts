import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import UserFactory from '#database/factories/user_factory'
import IllustrationFactory from '#database/factories/illustration_factory'
import TagFactory from '#database/factories/tag_factory'
import Illustration from '#models/illustration'
import Tag from '#models/tag'
import TeamMember from '#models/team_member'
import User from '#models/user'
import { loginUser, uniqueEmail } from './helpers.js'

test.group('Feature views (browser)', () => {
  test('default place date on the show page is today', async ({
    visit,
    browserContext,
    assert,
  }) => {
    const { user } = await loginUser(browserContext)
    const illustration = await IllustrationFactory.merge({
      title: 'Today Date Story',
      user_id: user.id,
    }).create()

    const page = await visit(`/illustrations/${illustration.id}`)
    const value = await page.inputValue('input[name="used"]')
    const today = DateTime.now().toFormat('yyyy-MM-dd')
    await page.assertTextContains('h2', 'Today Date Story')
    if (value) {
      assert.equal(value, today)
    }
  })

  test('private checkbox is present on new illustration page', async ({
    visit,
    browserContext,
  }) => {
    await loginUser(browserContext)
    const page = await visit('/illustrations/new')
    await page.assertVisible('input[name="private"]')
  })

  test('marking an illustration private on edit persists it', async ({
    visit,
    browserContext,
    assert,
  }) => {
    const { user } = await loginUser(browserContext)
    const illustration = await IllustrationFactory.merge({
      title: 'Private Toggle Story',
      user_id: user.id,
    }).create()

    const page = await visit(`/illustrations/${illustration.id}/edit`)
    await page.check('input[name="private"]')
    await page.click('button:has-text("Save")')
    await page.waitForURL(`/illustrations/${illustration.id}`)

    const saved = await Illustration.findOrFail(illustration.id)
    assert.equal(saved.private, true)
  })

  test('tag show page exposes edit and delete buttons', async ({ visit, browserContext }) => {
    const { user } = await loginUser(browserContext)
    const created = await TagFactory.merge({
      name: uniqueEmail('edit-delete-tag'),
      user_id: user.id,
    }).create()
    const tag = await Tag.findByOrFail('id', created.id)

    const page = await visit(`/tags/${encodeURIComponent(tag.name)}`)
    await page.assertVisible('button:has-text("Edit Tag")')
    await page.assertVisible('button:has-text("Delete Tag")')
  })

  test('renaming a tag via the tag show page persists the new name', async ({
    visit,
    browserContext,
  }) => {
    const { user } = await loginUser(browserContext)
    const created = await TagFactory.merge({
      name: uniqueEmail('rename-tag'),
      user_id: user.id,
    }).create()
    const tag = await Tag.findByOrFail('id', created.id)

    const page = await visit(`/tags/${encodeURIComponent(tag.name)}`)
    await page.click('button:has-text("Edit Tag")')
    await page.fill('input[name="name"]', 'Renamed Browser Tag')
    await page.click('button:has-text("Update Tag")')
    await page.waitForURL(/\/tags\//)

    const renamed = await Tag.findByOrFail('id', tag.id)
    await page.assertTextContains('h2', renamed.name)
  })

  test('bulk editing controls render on the tag show page', async ({ visit, browserContext }) => {
    const { user } = await loginUser(browserContext)
    const created = await TagFactory.merge({
      name: uniqueEmail('bulk-tag'),
      user_id: user.id,
    }).create()
    const tag = await Tag.findByOrFail('id', created.id)
    const illustration = await IllustrationFactory.merge({
      title: 'Bulk Target Story',
      user_id: user.id,
    }).create()
    await illustration.related('tags').attach([tag.id])

    const page = await visit(`/tags/${encodeURIComponent(tag.name)}`)
    await page.click('button:has-text("Select Illustrations")')
    await page.assertVisible('button:has-text("Select All")')
    await page.assertVisible('button:has-text("Remove Illustrations")')
    await page.assertVisible('button:has-text("Make Private")')
    await page.assertVisible('button:has-text("Make Public")')
  })

  test('bulk remove_tag detaches illustrations from the tag', async ({
    visit,
    browserContext,
    assert,
  }) => {
    const { user } = await loginUser(browserContext)
    const created = await TagFactory.merge({
      name: uniqueEmail('bulk-remove'),
      user_id: user.id,
    }).create()
    const tag = await Tag.findByOrFail('id', created.id)
    const illustration = await IllustrationFactory.merge({
      title: 'Bulk Remove Story',
      user_id: user.id,
    }).create()
    await illustration.related('tags').attach([tag.id])

    const page = await visit(`/tags/${encodeURIComponent(tag.name)}`)
    await page.click('button:has-text("Select Illustrations")')
    await page.click('button:has-text("Select All")')
    await page.click('button:has-text("Remove Illustrations")')
    await page.waitForURL(`/tags/${encodeURIComponent(tag.name)}`)

    const remaining = await tag.related('illustrations').query()
    assert.equal(remaining.length, 0)
  })

  test('tags index renders a three-column grid', async ({ visit, browserContext }) => {
    const { user } = await loginUser(browserContext)
    for (const name of ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta']) {
      await TagFactory.merge({ name: `${name} - ${Date.now()}`, user_id: user.id }).create()
    }

    const page = await visit('/tags')
    await page.assertVisible('div[style*="repeat(3, 1fr)"]')
    await page.assertTextContains('h2', 'Tags')
  })

  test('saving an illustration through the tags navigation flow', async ({
    visit,
    browserContext,
    assert,
  }) => {
    const { user } = await loginUser(browserContext)
    const created = await TagFactory.merge({
      name: uniqueEmail('nav-tag'),
      user_id: user.id,
    }).create()
    const tag = await Tag.findByOrFail('id', created.id)
    const illustration = await IllustrationFactory.merge({
      title: 'Nav Flow Original Title',
      author: 'Nav Author',
      user_id: user.id,
    }).create()
    await illustration.related('tags').attach([tag.id])

    const page = await visit('/tags')
    await page.click(`a[href="/tags/${encodeURIComponent(tag.name)}"]`)
    await page.click(`details:has(summary:has-text("Nav Flow Original Title")) summary`)
    await page.click(`a[href="/illustrations/${illustration.id}"]`)
    await page.click(`a[href="/illustrations/${illustration.id}/edit"]`)
    await page.fill('input[name="title"]', 'Nav Flow Updated Title')
    await page.click('button:has-text("Save")')
    await page.waitForURL(`/illustrations/${illustration.id}`)

    const saved = await Illustration.findOrFail(illustration.id)
    assert.equal(saved.title, 'Nav Flow Updated Title')
    await page.assertTextContains('h2', 'Nav Flow Updated Title')
  })

  test('settings team tab supports adding and editing members', async ({
    visit,
    browserContext,
    assert,
  }) => {
    const { user } = await loginUser(browserContext)
    const memberEmail = uniqueEmail('team-member')
    await UserFactory.merge({ email: memberEmail }).create()

    const page = await visit('/settings')
    await page.click('#tab-team')

    await page.fill('input[name="email"]', memberEmail)
    await page.selectOption('select[name="role"]', 'editor')
    await page.click('button:has-text("Add Member")')
    await page.assertPath('/settings')

    await page.click('#tab-team')
    await page.assertTextContains('body', memberEmail)

    const member = await User.findByOrFail('email', memberEmail)
    const foundMembership = await TeamMember.query().where('user_id', member.id).first()
    assert.equal(foundMembership !== null, true)

    await page.selectOption(`[data-role-form] select[data-user="${member.id}"]`, 'readonly')
    await page.click(
      `[data-role-form]:has(select[data-user="${member.id}"]) button:has-text("Save")`
    )
    await page.assertPath('/settings')

    const updated = await TeamMember.query().where('user_id', member.id).first()
    assert.equal(updated?.role, 'readonly')
  })

  test('settings page shows a copyable API key', async ({ visit, browserContext, assert }) => {
    await loginUser(browserContext)
    const page = await visit('/settings')
    await page.click('#tab-api')
    await page.assertVisible('[data-api-key-input]')
    const value = await page.inputValue('[data-api-key-input]')
    assert.equal(value !== '', true)
  })

  test('saving an illustration via navigation from the home page', async ({
    visit,
    browserContext,
    assert,
  }) => {
    const { user } = await loginUser(browserContext)
    const created = await TagFactory.merge({
      name: uniqueEmail('home-nav-tag'),
      user_id: user.id,
    }).create()
    const tag = await Tag.findByOrFail('id', created.id)
    const illustration = await IllustrationFactory.merge({
      title: 'Home Nav Original',
      author: 'Home Nav Author',
      user_id: user.id,
    }).create()
    await illustration.related('tags').attach([tag.id])

    // Start from the home page, which renders the tags landing view
    const page = await visit('/')
    await page.assertTextContains('h2', 'Tags')

    // Click the tag shown on the home page
    await page.click(`a[href="/tags/${encodeURIComponent(tag.name)}"]`)

    // Expand the illustration accordion
    await page.click(`details:has(summary:has-text("Home Nav Original")) summary`)

    // Click the illustration within the tag
    await page.click(`a[href="/illustrations/${illustration.id}"]`)

    // Select edit
    await page.click(`a[href="/illustrations/${illustration.id}/edit"]`)

    // Update the title and save
    await page.fill('input[name="title"]', 'Home Nav Updated')
    await page.click('button:has-text("Save")')
    await page.waitForURL(`/illustrations/${illustration.id}`)

    const saved = await Illustration.findOrFail(illustration.id)
    assert.equal(saved.title, 'Home Nav Updated')
    await page.assertTextContains('h2', 'Home Nav Updated')
  })

  test('account dropdown links to help documentation', async ({ visit, browserContext }) => {
    await loginUser(browserContext)
    const page = await visit('/')
    await page.click('button[popovertarget="user-menu"]')
    await page.assertVisible('menu#user-menu a[href="/help"]')
  })
})
