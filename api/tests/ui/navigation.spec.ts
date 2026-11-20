import { test, expect } from './fixtures/auth.fixture.js'

test.describe('Navigation', () => {
  test('header shows app name', async ({ loggedInPage: page }) => {
    await expect(page.getByRole('link', { name: 'SpeakerWindows' }).first()).toBeVisible()
  })

  test('header shows navigation links', async ({ loggedInPage: page }) => {
    await expect(page.getByRole('link', { name: 'Tags' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Search' }).first()).toBeVisible()
    await page.getByRole('button', { name: 'Account' }).click()
    await expect(page.getByRole('menuitem', { name: 'Settings' })).toBeVisible()
  })

  test('navigation links work', async ({ loggedInPage: page }) => {
    await page.getByRole('link', { name: 'Tags' }).first().click()
    await expect(page).toHaveURL('/tags')

    await page.getByRole('link', { name: 'Search' }).first().click()
    await expect(page).toHaveURL('/search')

    await page.getByRole('button', { name: 'Account' }).click()
    await page.getByRole('menuitem', { name: 'Settings' }).click()
    await expect(page).toHaveURL('/settings')
  })

  test('footer is visible', async ({ loggedInPage: page }) => {
    await expect(page.locator('footer')).toBeVisible()
  })

  test('dashboard page renders for authenticated user', async ({ loggedInPage: page }) => {
    await page.goto('/')
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })
})
