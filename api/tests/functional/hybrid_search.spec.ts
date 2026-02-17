import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import IllustrationFactory from '#database/factories/IllustrationFactory'
import UserFactory from '#database/factories/UserFactory'
import { SearchIndexingService } from '#services/search_indexing_service'
import { HybridSearchService } from '#services/hybrid_search_service'
import Illustration from '#models/illustration'

test.group('HybridSearchService', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('retrieveCandidates returns results for FTS title search', async ({ assert }) => {
    const user = await UserFactory.create()
    const ill = await IllustrationFactory.merge({ 
      title: 'React Components Tutorial', 
      content: 'Learn how to build components',
      user_id: user.id 
    }).create()

    const mockProvider = { embed: async () => Array(384).fill(0) }
    const indexing = new SearchIndexingService(mockProvider)
    await indexing.indexIllustration(ill.id)

    const candidates = await Illustration.retrieveCandidates('React', Array(384).fill(0))
    
    assert.isTrue(candidates.length >= 1)
    const found = candidates.find(c => c.illustrationId === ill.id)
    assert.isDefined(found)
    assert.isDefined(found?.ftsTitleRank)
  })

  test('retrieveCandidates returns results for FTS body search', async ({ assert }) => {
    const user = await UserFactory.create()
    const ill = await IllustrationFactory.merge({ 
      title: 'Some Title', 
      content: 'Machine learning algorithms',
      user_id: user.id 
    }).create()

    const mockProvider = { embed: async () => Array(384).fill(0) }
    const indexing = new SearchIndexingService(mockProvider)
    await indexing.indexIllustration(ill.id)

    const candidates = await Illustration.retrieveCandidates('learning', Array(384).fill(0))
    
    assert.isTrue(candidates.length >= 1)
    const found = candidates.find(c => c.illustrationId === ill.id)
    assert.isDefined(found)
    assert.isDefined(found?.ftsBodyRank)
  })

  test('retrieveCandidates returns results for fuzzy search', async ({ assert }) => {
    const user = await UserFactory.create()
    const ill = await IllustrationFactory.merge({ 
      title: 'Javscript Framework', 
      content: 'Some content',
      user_id: user.id 
    }).create()

    const mockProvider = { embed: async () => Array(384).fill(0) }
    const indexing = new SearchIndexingService(mockProvider)
    await indexing.indexIllustration(ill.id)

    const candidates = await Illustration.retrieveCandidates('Javascript', Array(384).fill(0))
    
    assert.isTrue(candidates.length >= 1)
    const found = candidates.find(c => c.illustrationId === ill.id)
    assert.isDefined(found)
    assert.isDefined(found?.fuzzyRank)
  })

  test('retrieveCandidates returns results for semantic search', async ({ assert }) => {
    const user = await UserFactory.create()
    const ill = await IllustrationFactory.merge({ 
      title: 'Neural Networks', 
      content: 'Deep learning models with weights',
      user_id: user.id 
    }).create()

    const mockProvider = { embed: async () => Array(384).fill(0.01) }
    const indexing = new SearchIndexingService(mockProvider)
    await indexing.indexIllustration(ill.id)

    const embedding = Array(384).fill(0.01)
    const candidates = await Illustration.retrieveCandidates('deep learning', embedding)
    
    assert.isTrue(candidates.length >= 1)
    const found = candidates.find(c => c.illustrationId === ill.id)
    assert.isDefined(found)
    assert.isDefined(found?.semanticRank)
  })

  test('Illustration.search returns ranked results', async ({ assert }) => {
    const user = await UserFactory.create()
    const ill1 = await IllustrationFactory.merge({ 
      title: 'Python Programming', 
      content: 'Learn Python basics',
      user_id: user.id 
    }).create()
    const ill2 = await IllustrationFactory.merge({ 
      title: 'JavaScript Basics', 
      content: 'JavaScript fundamentals',
      user_id: user.id 
    }).create()

    const mockProvider = { embed: async () => Array(384).fill(0) }
    const indexing = new SearchIndexingService(mockProvider)
    await indexing.indexIllustration(ill1.id)
    await indexing.indexIllustration(ill2.id)

    const results = await Illustration.search('Python', Array(384).fill(0), { limit: 10 })
    
    assert.isArray(results)
    assert.isTrue(results.length >= 1)
  })

  test('Illustration.search respects limit parameter', async ({ assert }) => {
    const user = await UserFactory.create()
    
    for (let i = 0; i < 5; i++) {
      const ill = await IllustrationFactory.merge({ 
        title: `Test Title ${i}`, 
        content: `Content ${i}`,
        user_id: user.id 
      }).create()
      
      const mockProvider = { embed: async () => Array(384).fill(0) }
      const indexing = new SearchIndexingService(mockProvider)
      await indexing.indexIllustration(ill.id)
    }

    const results = await Illustration.search('Test', Array(384).fill(0), { limit: 2 })
    
    assert.isArray(results)
    assert.isTrue(results.length <= 2)
  })

  test('Illustration.search returns empty array when no matches', async ({ assert }) => {
    const results = await Illustration.search('NonexistentQueryXYZ123', Array(384).fill(0))
    
    assert.isArray(results)
    assert.equal(results.length, 0)
  })

  test('HybridSearchService combines multiple retrieval methods', async ({ assert }) => {
    const user = await UserFactory.create()
    const ill = await IllustrationFactory.merge({ 
      title: 'TypeScript Guide', 
      content: 'Programming with TypeScript',
      user_id: user.id 
    }).create()

    const mockProvider = { embed: async () => Array(384).fill(0) }
    const indexing = new SearchIndexingService(mockProvider)
    await indexing.indexIllustration(ill.id)

    const hybridService = new HybridSearchService()
    const candidates = await hybridService.retrieve('TypeScript', Array(384).fill(0))
    
    assert.isTrue(candidates.length >= 1)
    const found = candidates.find(c => c.illustrationId === ill.id)
    assert.isDefined(found)
  })
})
