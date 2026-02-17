import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import UserFactory from '#database/factories/UserFactory'
import IllustrationFactory from '#database/factories/IllustrationFactory'
import Illustration from '#models/illustration'
import IllustrationsController from '#controllers/http/IllustrationsController'

test.group('IllustrationsController.search', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('controller calls Illustration.search and handles empty query', async ({ assert }) => {
    const user = await UserFactory.create()
    const ill = await IllustrationFactory.merge({
      title: 'Controller Search',
      user_id: user.id,
    }).create()

    // Spy on Illustration.search
    let called = false
    const original = Illustration.search
    ;(Illustration as any).search = async (...args: any[]) => {
      called = true
      return [ill]
    }

    const controller = new IllustrationsController()

    // Mock context
    const ctx: any = {
      request: {
        input: (key: string, def: any) => {
          if (key === 'q') return 'Controller'
          return def
        },
      },
      auth: { user },
      response: {
        ok: (data: any) => data,
        badRequest: (d: any) => d,
        internalServerError: (d: any) => d,
      },
    }

    const res = await controller.search(ctx as any)
    assert.isTrue(called)

    // restore
    ;(Illustration as any).search = original
  })

  test('empty query returns 400', async ({ assert }) => {
    const controller = new IllustrationsController()
    const ctx: any = {
      request: { input: (k: string) => '' },
      auth: { user: { id: 1 } },
      response: { badRequest: (d: any) => d },
    }

    const out = await controller.search(ctx as any)
    assert.equal(out.error, 'Query parameter "q" is required')
  })
})
