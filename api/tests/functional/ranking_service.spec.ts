import { test } from '@japa/runner'
import IllustrationFactory from '#database/factories/IllustrationFactory'
import { RankingService } from '#services/ranking_service'
import { CandidateRank } from '#services/hybrid_search_service'
import Illustration from '#models/illustration'

test.group('RankingService', (group) => {
  group.each.setup(async () => {
    return () => {}
  })

  test('recency boost and user affinity boost combine', async ({ assert }) => {
    const ill = (await IllustrationFactory.create()).toJSON() as any
    const ilModel = await Illustration.findOrFail(ill.id)

    // make illustration very recent
    ilModel.createdAt = new Date()
    await ilModel.save()

    const ranker = new RankingService({ boostFactors: { enabled: true, recency: 2.0, userAffinity: 3.0 } })
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

    ilModel.createdAt = new Date()
    await ilModel.save()

    const ranker = new RankingService({ boostFactors: { enabled: true, recency: 1.5, userAffinity: 2.0 } })
    const cand: CandidateRank[] = [{ illustrationId: ilModel.id, ftsTitleRank: 1 }]
    const map = new Map<number, Illustration>([[ilModel.id, ilModel]])

    const res = await ranker.rank(cand, map)
    assert.isAbove(res[0].finalScore, res[0].rrfScore)
  })
})
