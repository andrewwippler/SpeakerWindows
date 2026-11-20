import { test } from '@japa/runner'

test.group('Health', () => {
  test('Health check succeeds', async ({ client, assert }) => {
    const response = await client.get('/api/healthz')
    assert.isOk(response)
  })

  test('Readiness probe can access /healthz', async ({ client, assert }) => {
    const response = await client.get('/healthz')

    response.assertStatus(200)
    assert.isTrue(response.body().isHealthy)
  })
})
