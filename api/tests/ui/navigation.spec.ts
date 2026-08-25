import { test, expect } from './fixtures/auth.fixture'

test.describe('Navigation', () => {
  test('header shows app name', async ({ loggedInPage: page }) => {
    await expect(page.locator('a:has-text("SpeakerWindows")')).toBeVisible()
  })

  test('header shows navigation links', async ({ loggedInPage: page }) => {
    await expect(page.locator('a:has-text("Dashboard")')).toBeVisible()
    await expect(page.locator('a:has-text("Search")')).toBeVisible()
    await expect(page.locator('a:has-text("Settings")')).toBeVisible()
  })

  test('navigation links work', async ({ loggedInPage: page }) => {
    await page.click('a:has-text("Dashboard")')
    await expect(page).toHaveURL('/')

    await page.click('a:has-text("Search")')
    await expect(page).toHaveURL('/search')

    await page.click('a:has-text("Settings")')
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
