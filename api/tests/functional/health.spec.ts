import { test } from '@japa/runner'

test.group('Health', () => {
  test('Health check succeeds', async ({ client, assert }) => {

    const response = await client.get('/healthz')
    assert.isOk(response)
  })
})