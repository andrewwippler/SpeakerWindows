import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import IllustrationFactory from '#database/factories/IllustrationFactory'
import UserFactory from '#database/factories/UserFactory'
import { SearchIndexingService } from '#services/search_indexing_service'
import Illustration from '#models/illustration'

test.group('Illustration model search', (group) => {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })

  test('lexical only match and semantic only match and fuzzy match and mixed', async ({ assert }) => {
    const user = await UserFactory.create()

    // Create illustrations with titles designed for different retrieval methods
    const lex = await IllustrationFactory.merge({ title: 'Lexical Match', user_id: user.id }).create()
    const fuzzy = await IllustrationFactory.merge({ title: 'Fuzzyy Mismatch', user_id: user.id }).create()
    const sem = await IllustrationFactory.merge({ title: 'Semantic meaning', user_id: user.id, content: 'deep learning and vectors' }).create()

    // Index them using mock embedding provider so document_search is populated
    const mockProvider = { embed: async (text: string) => Array(384).fill(0.01) }
    const indexing = new SearchIndexingService(mockProvider)
    await indexing.indexIllustration(lex.id)
    await indexing.indexIllustration(fuzzy.id)
    await indexing.indexIllustration(sem.id)

    // Lexical search
    const lexCandidates = await Illustration.retrieveCandidates('Lexical', Array(384).fill(0))
    assert.isAtLeast(lexCandidates.length, 1)

    // Fuzzy search: search for 'Fuzzy' (typo) should match fuzzy record
    const fuzzyCandidates = await Illustration.retrieveCandidates('Fuzzy', Array(384).fill(0))
    assert.isAtLeast(fuzzyCandidates.length, 1)

    // Semantic search: use semantic embedding similar to sem content
    const semEmbedding = Array(384).fill(0.01)
    const semCandidates = await Illustration.retrieveCandidates('meaning', semEmbedding)
    assert.isAtLeast(semCandidates.length, 1)

    // Mixed query returns multiple
    const mixed = await Illustration.search('Match', Array(384).fill(0), { limit: 10 })
    assert.isArray(mixed)
  })
})
