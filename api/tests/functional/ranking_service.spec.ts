import { test } from '@japa/runner'
import IllustrationFactory from '#database/factories/IllustrationFactory'
import { RankingService } from '#services/ranking_service'
import { CandidateRank } from '#services/hybrid_search_service'
import Illustration from '#models/illustration'
import { DateTime } from 'luxon'

test.group('RankingService', (group) => {
  group.each.setup(async () => {
    return () => {}
  })

  test('recency boost and user affinity boost combine', async ({ assert }) => {
    const ill = (await IllustrationFactory.create()).toJSON() as any
    const ilModel = await Illustration.findOrFail(ill.id)

    // make illustration very recent
    ilModel.createdAt = DateTime.now()
    await ilModel.save()

    const ranker = new RankingService({
      boostFactors: { enabled: true, recency: 2.0, userAffinity: 3.0 },
    })
    const cand: CandidateRank[] = [{ illustrationId: ilModel.id, ftsTitleRank: 1 }]
    const map = new Map<number, Illustration>([[ilModel.id, ilModel]])

    const res = await ranker.rank(cand, map)
    assert.isAbove(res[0].boostedScore, res[0].rrfScore)
    // Ensure userAffinity applied
    assert.equal(res[0].boosts.userAffinity, 3.0)
  })

  test('no boost when disabled', async ({ assert }) => {
    const ill = (await IllustrationFactory.create()).toJSON() as any
    const ilModel = await Illustration.findOrFail(ill.id)

    const ranker = new RankingService({ boostFactors: { enabled: false } })
    const cand: CandidateRank[] = [{ illustrationId: ilModel.id, ftsTitleRank: 1 }]
    const map = new Map<number, Illustration>([[ilModel.id, ilModel]])

    const res = await ranker.rank(cand, map)
    assert.equal(res[0].boostedScore, res[0].rrfScore)
  })

  test('multiple boosts combined produce larger score', async ({ assert }) => {
    const ill = (await IllustrationFactory.create()).toJSON() as any
    const ilModel = await Illustration.findOrFail(ill.id)

    ilModel.createdAt = DateTime.now()
    await ilModel.save()

    const ranker = new RankingService({
      boostFactors: { enabled: true, recency: 1.5, userAffinity: 2.0 },
    })
    const cand: CandidateRank[] = [{ illustrationId: ilModel.id, ftsTitleRank: 1 }]
    const map = new Map<number, Illustration>([[ilModel.id, ilModel]])

    const res = await ranker.rank(cand, map)
    assert.isAbove(res[0].finalScore, res[0].rrfScore)
  })

  test('sortByTitleMatchFirst puts matching titles first alphabetically', async ({ assert }) => {
    const user = await IllustrationFactory.create()

    const ill1 = Object.assign(await IllustrationFactory.create(), {
      title: 'Zebra Guide',
    }) as Illustration
    const ill2 = Object.assign(await IllustrationFactory.create(), {
      title: 'Apple Book',
    }) as Illustration
    const ill3 = Object.assign(await IllustrationFactory.create(), {
      title: 'Python Tutorial',
    }) as Illustration
    const ill4 = Object.assign(await IllustrationFactory.create(), {
      title: 'Banana Recipe',
    }) as Illustration

    const ranker = new RankingService()

    const rankedResults = [
      {
        illustration: ill1,
        rrfScore: 1,
        rrfScores: {} as any,
        boostedScore: 1,
        boosts: {} as any,
        finalScore: 1,
      },
      {
        illustration: ill2,
        rrfScore: 1,
        rrfScores: {} as any,
        boostedScore: 1,
        boosts: {} as any,
        finalScore: 1,
      },
      {
        illustration: ill3,
        rrfScore: 1,
        rrfScores: {} as any,
        boostedScore: 1,
        boosts: {} as any,
        finalScore: 1,
      },
      {
        illustration: ill4,
        rrfScore: 1,
        rrfScores: {} as any,
        boostedScore: 1,
        boosts: {} as any,
        finalScore: 1,
      },
    ]

    const sorted = ranker.sortByTitleMatchFirst(rankedResults, 'Python')

    assert.equal(sorted.length, 4)
    assert.equal(sorted[0].illustration.title, 'Python Tutorial')
    assert.equal(sorted[1].illustration.title, 'Apple Book')
    assert.equal(sorted[2].illustration.title, 'Banana Recipe')
    assert.equal(sorted[3].illustration.title, 'Zebra Guide')
  })

  test('sortByTitleMatchFirst sorts alphabetically within each group', async ({ assert }) => {
    const user = await IllustrationFactory.create()

    const ill1 = Object.assign(await IllustrationFactory.create(), {
      title: 'React Guide',
    }) as Illustration
    const ill2 = Object.assign(await IllustrationFactory.create(), {
      title: 'Vue Tutorial',
    }) as Illustration
    const ill3 = Object.assign(await IllustrationFactory.create(), {
      title: 'Angular Intro',
    }) as Illustration
    const ill4 = Object.assign(await IllustrationFactory.create(), {
      title: 'Svelte Basics',
    }) as Illustration
    const ill5 = Object.assign(await IllustrationFactory.create(), {
      title: 'React Native',
    }) as Illustration

    const ranker = new RankingService()

    const rankedResults = [
      {
        illustration: ill1,
        rrfScore: 1,
        rrfScores: {} as any,
        boostedScore: 1,
        boosts: {} as any,
        finalScore: 1,
      },
      {
        illustration: ill2,
        rrfScore: 1,
        rrfScores: {} as any,
        boostedScore: 1,
        boosts: {} as any,
        finalScore: 1,
      },
      {
        illustration: ill3,
        rrfScore: 1,
        rrfScores: {} as any,
        boostedScore: 1,
        boosts: {} as any,
        finalScore: 1,
      },
      {
        illustration: ill4,
        rrfScore: 1,
        rrfScores: {} as any,
        boostedScore: 1,
        boosts: {} as any,
        finalScore: 1,
      },
      {
        illustration: ill5,
        rrfScore: 1,
        rrfScores: {} as any,
        boostedScore: 1,
        boosts: {} as any,
        finalScore: 1,
      },
    ]

    const sorted = ranker.sortByTitleMatchFirst(rankedResults, 'React')

    assert.equal(sorted.length, 5)
    assert.equal(sorted[0].illustration.title, 'React Guide')
    assert.equal(sorted[1].illustration.title, 'React Native')
    assert.equal(sorted[2].illustration.title, 'Angular Intro')
    assert.equal(sorted[3].illustration.title, 'Svelte Basics')
    assert.equal(sorted[4].illustration.title, 'Vue Tutorial')
  })

  test('sortByTitleMatchFirst handles case insensitive matching', async ({ assert }) => {
    const user = await IllustrationFactory.create()

    const ill1 = Object.assign(await IllustrationFactory.create(), {
      title: 'PYTHON Basics',
    }) as Illustration
    const ill2 = Object.assign(await IllustrationFactory.create(), {
      title: 'Java Programming',
    }) as Illustration

    const ranker = new RankingService()

    const rankedResults = [
      {
        illustration: ill1,
        rrfScore: 1,
        rrfScores: {} as any,
        boostedScore: 1,
        boosts: {} as any,
        finalScore: 1,
      },
      {
        illustration: ill2,
        rrfScore: 1,
        rrfScores: {} as any,
        boostedScore: 1,
        boosts: {} as any,
        finalScore: 1,
      },
    ]

    const sorted = ranker.sortByTitleMatchFirst(rankedResults, 'python')

    assert.equal(sorted.length, 2)
    assert.equal(sorted[0].illustration.title, 'PYTHON Basics')
    assert.equal(sorted[1].illustration.title, 'Java Programming')
  })

  test('sortByTitleMatchFirst handles no matches', async ({ assert }) => {
    const user = await IllustrationFactory.create()

    const ill1 = Object.assign(await IllustrationFactory.create(), {
      title: 'Apple Guide',
    }) as Illustration
    const ill2 = Object.assign(await IllustrationFactory.create(), {
      title: 'Banana Book',
    }) as Illustration

    const ranker = new RankingService()

    const rankedResults = [
      {
        illustration: ill1,
        rrfScore: 1,
        rrfScores: {} as any,
        boostedScore: 1,
        boosts: {} as any,
        finalScore: 1,
      },
      {
        illustration: ill2,
        rrfScore: 1,
        rrfScores: {} as any,
        boostedScore: 1,
        boosts: {} as any,
        finalScore: 1,
      },
    ]

    const sorted = ranker.sortByTitleMatchFirst(rankedResults, 'Python')

    assert.equal(sorted.length, 2)
    assert.equal(sorted[0].illustration.title, 'Apple Guide')
    assert.equal(sorted[1].illustration.title, 'Banana Book')
  })
})
