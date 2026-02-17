import { test } from '@japa/runner'
import LocalEmbeddingProvider from '#services/local_embedding_provider'

test.group('LocalEmbeddingProvider', (group) => {
  group.each.setup(async () => {
    return () => {}
  })

  test('embed returns array of numbers', async ({ assert }) => {
    const result = await LocalEmbeddingProvider.embed('hello world')

    assert.isTrue(Array.isArray(result))
    assert.isTrue(result.length > 0)
    result.forEach((val: number) => {
      assert.isTrue(typeof val === 'number')
    })
  })

  test('embed returns 384-dimensional vector', async ({ assert }) => {
    const result = await LocalEmbeddingProvider.embed('test text')

    assert.equal(result.length, 384)
  })

  test('embed produces different vectors for different text', async ({ assert }) => {
    const result1 = await LocalEmbeddingProvider.embed('hello world')
    const result2 = await LocalEmbeddingProvider.embed('different text')

    assert.isFalse(JSON.stringify(result1) === JSON.stringify(result2))
  })

  test('embed produces similar vectors for similar text', async ({ assert }) => {
    const result1 = await LocalEmbeddingProvider.embed('machine learning')
    const result2 = await LocalEmbeddingProvider.embed('machine learning algorithms')

    assert.isTrue(Array.isArray(result1))
    assert.isTrue(Array.isArray(result2))

    let similarity = 0
    for (let i = 0; i < result1.length; i++) {
      similarity += result1[i] * result2[i]
    }

    assert.isTrue(similarity > 0.5, 'Similar text should have high cosine similarity')
  })

  test('warmUp initializes the pipeline', async ({ assert }) => {
    await LocalEmbeddingProvider.warmUp()

    const result = await LocalEmbeddingProvider.embed('test')
    assert.isTrue(result.length === 384)
  })
})
