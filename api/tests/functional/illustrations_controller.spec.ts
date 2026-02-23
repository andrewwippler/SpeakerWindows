import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import UserFactory from '#database/factories/UserFactory'
import IllustrationFactory from '#database/factories/IllustrationFactory'
import Illustration from '#models/illustration'
import IllustrationsController from '#controllers/http/IllustrationsController'
import TeamFactory from '#database/factories/TeamFactory'
import TeamMemberFactory from '#database/factories/TeamMemberFactory'
import TagFactory from '#database/factories/TagFactory'
import Tag from '#models/tag'

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

test.group('IllustrationsController.bulk', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('Owner can toggle privacy of their own illustration', async ({ client, assert }) => {
    const owner = await UserFactory.merge({ password: 'testpassword123' }).create()
    const illustration = await IllustrationFactory.merge({
      user_id: owner.id,
      private: false,
    }).create()

    const loginResponse = await client.post('/login').json({
      email: owner.email,
      password: 'testpassword123',
    })
    const token = loginResponse.body().token

    const response = await client
      .put('/illustrations/bulk')
      .bearerToken(token)
      .json({
        illustrations: [illustration.id],
        action: 'toggle_privacy',
        data: true,
      })

    response.assertStatus(200)
    assert.include(response.body().message, 'Updated privacy')

    await illustration.refresh()
    assert.isTrue(illustration.private)
  })

  test('Owner cannot toggle privacy of another users illustration', async ({ client, assert }) => {
    const owner = await UserFactory.merge({ password: 'testpassword123' }).create()
    const otherUser = await UserFactory.merge({ password: 'testpassword123' }).create()
    const illustration = await IllustrationFactory.merge({
      user_id: otherUser.id,
      private: false,
    }).create()

    const loginResponse = await client.post('/login').json({
      email: owner.email,
      password: 'testpassword123',
    })
    const token = loginResponse.body().token

    const response = await client
      .put('/illustrations/bulk')
      .bearerToken(token)
      .json({
        illustrations: [illustration.id],
        action: 'toggle_privacy',
        data: true,
      })

    response.assertStatus(403)
    assert.include(response.body().message, 'permission')
  })

  test('Non-existent illustration returns 400', async ({ client, assert }) => {
    const user = await UserFactory.merge({ password: 'testpassword123' }).create()

    const loginResponse = await client.post('/login').json({
      email: user.email,
      password: 'testpassword123',
    })
    const token = loginResponse.body().token

    const response = await client
      .put('/illustrations/bulk')
      .bearerToken(token)
      .json({
        illustrations: [99999],
        action: 'toggle_privacy',
        data: true,
      })

    response.assertStatus(400)
    assert.include(response.body().message, 'not found')
  })

  test('Team owner can remove tag from team illustration', async ({ client, assert }) => {
    const teamOwner = await UserFactory.merge({ password: 'testpassword123' }).create()
    const team = await TeamFactory.merge({ userId: teamOwner.id }).create()
    const illustration = await IllustrationFactory.merge({
      user_id: teamOwner.id,
      team_id: team.id,
    }).create()
    const tag = await TagFactory.create()
    const tag2 = await TagFactory.create()
    await illustration.related('tags').attach([tag.id, tag2.id])

    const loginResponse = await client.post('/login').json({
      email: teamOwner.email,
      password: 'testpassword123',
    })
    const token = loginResponse.body().token

    const response = await client
      .put('/illustrations/bulk')
      .bearerToken(token)
      .json({
        illustrations: [illustration.id],
        action: 'remove_tag',
        data: tag.name,
      })

    response.assertStatus(200)
    assert.include(response.body().message, `Removed tag`)
  })

  test('Creator can remove tag from team illustration', async ({ client, assert }) => {
    const teamOwner = await UserFactory.merge({ password: 'testpassword123' }).create()
    const creator = await UserFactory.merge({ password: 'testpassword123' }).create()
    const team = await TeamFactory.merge({ userId: teamOwner.id }).create()
    await TeamMemberFactory.merge({ userId: creator.id, teamId: team.id, role: 'creator' }).create()

    const illustration = await IllustrationFactory.merge({
      user_id: creator.id,
      team_id: team.id,
    }).create()
    const tag = await TagFactory.create()
    const tag2 = await TagFactory.create()
    await illustration.related('tags').attach([tag.id, tag2.id])

    const loginResponse = await client.post('/login').json({
      email: creator.email,
      password: 'testpassword123',
    })
    const token = loginResponse.body().token

    const response = await client
      .put('/illustrations/bulk')
      .bearerToken(token)
      .json({
        illustrations: [illustration.id],
        action: 'remove_tag',
        data: tag.name,
      })

    response.assertStatus(200)
  })

  test('Editor can remove tag from team illustration', async ({ client, assert }) => {
    const teamOwner = await UserFactory.merge({ password: 'testpassword123' }).create()
    const editor = await UserFactory.merge({ password: 'testpassword123' }).create()
    const team = await TeamFactory.merge({ userId: teamOwner.id }).create()
    await TeamMemberFactory.merge({ userId: editor.id, teamId: team.id, role: 'editor' }).create()

    const illustration = await IllustrationFactory.merge({
      user_id: teamOwner.id,
      team_id: team.id,
    }).create()
    const tag = await TagFactory.create()
    const tag2 = await TagFactory.create()
    await illustration.related('tags').attach([tag.id, tag2.id])

    const loginResponse = await client.post('/login').json({
      email: editor.email,
      password: 'testpassword123',
    })
    const token = loginResponse.body().token

    const response = await client
      .put('/illustrations/bulk')
      .bearerToken(token)
      .json({
        illustrations: [illustration.id],
        action: 'remove_tag',
        data: tag.name,
      })

    response.assertStatus(200)
  })

  test('Readonly member cannot remove tag from team illustration', async ({ client, assert }) => {
    const teamOwner = await UserFactory.merge({ password: 'testpassword123' }).create()
    const readonly = await UserFactory.merge({ password: 'testpassword123' }).create()
    const team = await TeamFactory.merge({ userId: teamOwner.id }).create()
    await TeamMemberFactory.merge({
      userId: readonly.id,
      teamId: team.id,
      role: 'readonly',
    }).create()

    const illustration = await IllustrationFactory.merge({
      user_id: teamOwner.id,
      team_id: team.id,
    }).create()
    const tag = await TagFactory.create()
    await illustration.related('tags').attach([tag.id])

    const loginResponse = await client.post('/login').json({
      email: readonly.email,
      password: 'testpassword123',
    })
    const token = loginResponse.body().token

    const response = await client
      .put('/illustrations/bulk')
      .bearerToken(token)
      .json({
        illustrations: [illustration.id],
        action: 'remove_tag',
        data: tag.name,
      })

    response.assertStatus(403)
    assert.include(response.body().message, 'permission')
  })

  test('Cannot remove tag from different team illustration', async ({ client, assert }) => {
    const teamOwner1 = await UserFactory.merge({ password: 'testpassword123' }).create()
    const teamOwner2 = await UserFactory.merge({ password: 'testpassword123' }).create()
    const team1 = await TeamFactory.merge({ userId: teamOwner1.id }).create()
    const team2 = await TeamFactory.merge({ userId: teamOwner2.id }).create()

    const illustration = await IllustrationFactory.merge({
      user_id: teamOwner2.id,
      team_id: team2.id,
    }).create()
    const tag = await TagFactory.create()
    await illustration.related('tags').attach([tag.id])

    const loginResponse = await client.post('/login').json({
      email: teamOwner1.email,
      password: 'testpassword123',
    })
    const token = loginResponse.body().token

    const response = await client
      .put('/illustrations/bulk')
      .bearerToken(token)
      .json({
        illustrations: [illustration.id],
        action: 'remove_tag',
        data: tag.name,
      })

    response.assertStatus(403)
  })

  test('Cannot remove non-existent tag from illustration', async ({ client, assert }) => {
    const user = await UserFactory.merge({ password: 'testpassword123' }).create()
    const illustration = await IllustrationFactory.merge({
      user_id: user.id,
    }).create()
    const tag = await TagFactory.create()
    await illustration.related('tags').attach([tag.id])

    const loginResponse = await client.post('/login').json({
      email: user.email,
      password: 'testpassword123',
    })
    const token = loginResponse.body().token

    const response = await client
      .put('/illustrations/bulk')
      .bearerToken(token)
      .json({
        illustrations: [illustration.id],
        action: 'remove_tag',
        data: 'nonexistent-tag',
      })

    response.assertStatus(400)
    assert.include(response.body().message, 'not found')
  })

  test('Cannot remove last tag from illustration', async ({ client, assert }) => {
    const user = await UserFactory.merge({ password: 'testpassword123' }).create()
    const illustration = await IllustrationFactory.merge({
      user_id: user.id,
    }).create()
    const tag = await TagFactory.create()
    await illustration.related('tags').attach([tag.id])

    const loginResponse = await client.post('/login').json({
      email: user.email,
      password: 'testpassword123',
    })
    const token = loginResponse.body().token

    const response = await client
      .put('/illustrations/bulk')
      .bearerToken(token)
      .json({
        illustrations: [illustration.id],
        action: 'remove_tag',
        data: tag.name,
      })

    response.assertStatus(400)
    assert.include(response.body().message, 'Cannot remove the last tag')
  })

  test('Missing illustrations array returns 400', async ({ client, assert }) => {
    const user = await UserFactory.merge({ password: 'testpassword123' }).create()

    const loginResponse = await client.post('/login').json({
      email: user.email,
      password: 'testpassword123',
    })
    const token = loginResponse.body().token

    const response = await client.put('/illustrations/bulk').bearerToken(token).json({
      action: 'toggle_privacy',
      data: true,
    })

    response.assertStatus(400)
    assert.include(response.body().message, 'illustrations array')
  })

  test('Invalid action returns 400', async ({ client, assert }) => {
    const user = await UserFactory.merge({ password: 'testpassword123' }).create()

    const loginResponse = await client.post('/login').json({
      email: user.email,
      password: 'testpassword123',
    })
    const token = loginResponse.body().token

    const response = await client
      .put('/illustrations/bulk')
      .bearerToken(token)
      .json({
        illustrations: [1],
        action: 'invalid_action',
        data: true,
      })

    response.assertStatus(400)
    assert.include(response.body().message, 'Invalid action')
  })
})
