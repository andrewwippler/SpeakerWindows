import { test } from '@japa/runner'
import UserFactory from '#database/factories/UserFactory'
import IllustrationFactory from '#database/factories/IllustrationFactory'
import db from '@adonisjs/lucid/services/db'
import { IndexIllustrationJob } from '#jobs/index_illustration_job'

test.group('IndexIllustrationJob', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('embedding generation invoked and search index updated', async ({ assert }) => {
    const user = await UserFactory.create()
    const ill = await IllustrationFactory.merge({ user_id: user.id, title: 'Index Me' }).create()

    let embedCalled = false
    const mockProvider = {
      embed: async (text: string) => {
        embedCalled = true
        return Array(384).fill(0.1)
      },
    }
    const job = new IndexIllustrationJob(mockProvider)

    await job.handle({ illustrationId: ill.id })

    assert.isTrue(embedCalled)

    const rows = await db.rawQuery('SELECT * FROM document_search WHERE document_id = ?', [ill.id])
    assert.isAtLeast(rows.rows.length, 1)
  })

  test('job handles failures by throwing (and not crashing)', async ({ assert }) => {
    const user = await UserFactory.create()
    const ill = await IllustrationFactory.merge({ user_id: user.id, title: 'Broken' }).create()

    const badProvider = {
      embed: async () => {
        throw new Error('embed fail')
      },
    }
    const job = new IndexIllustrationJob(badProvider)

    await assert.rejects(async () => await job.handle({ illustrationId: ill.id }))
  })
})
