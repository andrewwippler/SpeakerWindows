/**
 * Illustration Search Ranker
 *
 * Computes RRF scores and applies boosting for illustration search results.
 * Takes raw candidate ranks from HybridSearchService and returns scored results.
 */

import Illustration from '#models/illustration'
import { CandidateRank } from './hybrid_search_service.js'

export interface RankerConfig {
  weights?: {
    fts_title?: number
    fts_body?: number
    fuzzy?: number
    semantic?: number
  }
  k?: number
  boostFactors?: {
    enabled: boolean
    recency?: number
    userAffinity?: number
    popularity?: number
  }
}

export interface RankedIllustration {
  illustration: Illustration
  rrfScore: number
  rrfScores: {
    fts_title: number
    fts_body: number
    fuzzy: number
    semantic: number
  }
  boostedScore: number
  boosts: {
    recency: number
    userAffinity: number
    popularity: number
  }
  finalScore: number
}

/**
 * Service to rank illustrations using RRF + boosting
 */
export class IllustrationSearchRanker {
  private config: Required<RankerConfig>

  constructor(config: RankerConfig = {}) {
    this.config = {
      weights: {
        fts_title: config.weights?.fts_title ?? 1.2,
        fts_body: config.weights?.fts_body ?? 0.6,
        fuzzy: config.weights?.fuzzy ?? 0.4,
        semantic: config.weights?.semantic ?? 1.0
      },
      k: config.k ?? 60,
      boostFactors: {
        enabled: config.boostFactors?.enabled ?? true,
        recency: config.boostFactors?.recency ?? 1.2,
        userAffinity: config.boostFactors?.userAffinity ?? 1.5,
        popularity: config.boostFactors?.popularity ?? 1.1
      }
    }
  }

  /**
   * Compute RRF score for a candidate
   *
   * score = w1/(k + rank_fts_title) + w2/(k + rank_fts_body) + w3/(k + rank_fuzzy) + w4/(k + rank_semantic)
   */
  private computeRRF(candidate: CandidateRank): { score: number; breakdown: Record<string, number> } {
    const breakdown: Record<string, number> = {}
    let score = 0

    if (candidate.ftsTitleRank !== undefined) {
      const contribution = this.config.weights.fts_title / (this.config.k + candidate.ftsTitleRank)
      breakdown.fts_title = contribution
      score += contribution
    } else {
      breakdown.fts_title = 0
    }

    if (candidate.ftsBodyRank !== undefined) {
      const contribution = this.config.weights.fts_body / (this.config.k + candidate.ftsBodyRank)
      breakdown.fts_body = contribution
      score += contribution
    } else {
      breakdown.fts_body = 0
    }

    if (candidate.fuzzyRank !== undefined) {
      const contribution = this.config.weights.fuzzy / (this.config.k + candidate.fuzzyRank)
      breakdown.fuzzy = contribution
      score += contribution
    } else {
      breakdown.fuzzy = 0
    }

    if (candidate.semanticRank !== undefined) {
      const contribution = this.config.weights.semantic / (this.config.k + candidate.semanticRank)
      breakdown.semantic = contribution
      score += contribution
    } else {
      breakdown.semantic = 0
    }

    return { score, breakdown }
  }

  /**
   * Apply multiplicative boosting to RRF score
   */
  private applyBoosting(
    rrfScore: number,
    illustration: Illustration,
    metadata?: { view_count?: number }
  ): { score: number; boosts: { recency: number; userAffinity: number; popularity: number } } {
    const boosts = {
      recency: this.computeRecencyBoost(illustration.createdAt),
      userAffinity: 1.0, // Extensible for user preferences
      popularity: this.computePopularityBoost(metadata?.view_count ?? 0)
    }

    const score = rrfScore * boosts.recency * boosts.userAffinity * boosts.popularity

    return { score, boosts }
  }

  /**
   * Recency boost: linear decay over 90 days
   */
  private computeRecencyBoost(createdAt: any): number {
    if (!createdAt) return 1.0

    const days = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
    const maxDays = 90

    if (days <= 0) return this.config.boostFactors.recency
    if (days >= maxDays) return 1.0

    return 1.0 + (this.config.boostFactors.recency - 1.0) * (1 - days / maxDays)
  }

  /**
   * Popularity boost: logarithmic based on view count
   */
  private computePopularityBoost(viewCount: number): number {
    if (viewCount <= 0) return 1.0

    const logBoost = Math.log(1 + viewCount)
    const maxBenefit = this.config.boostFactors.popularity

    return Math.min(maxBenefit, 1.0 + logBoost * 0.2)
  }

  /**
   * Rank illustrations with RRF + boosting
   */
  async rank(
    candidates: CandidateRank[],
    illustrations: Map<number, Illustration>,
    metadataMap?: Map<number, { view_count?: number }>
  ): Promise<RankedIllustration[]> {
    const rankedResults: RankedIllustration[] = []

    for (const candidate of candidates) {
      const illustration = illustrations.get(candidate.illustrationId)
      if (!illustration) continue

      // Step 1: Compute RRF
      const { score: rrfScore, breakdown: rrfBreakdown } = this.computeRRF(candidate)

      // Step 2: Apply boosting
      const metadata = metadataMap?.get(candidate.illustrationId)
      let boostedScore = rrfScore
      let boosts = { recency: 1.0, userAffinity: 1.0, popularity: 1.0 }

      if (this.config.boostFactors.enabled) {
        const boosted = this.applyBoosting(rrfScore, illustration, metadata)
        boostedScore = boosted.score
        boosts = boosted.boosts
      }

      rankedResults.push({
        illustration,
        rrfScore,
        rrfScores: {
          fts_title: rrfBreakdown.fts_title ?? 0,
          fts_body: rrfBreakdown.fts_body ?? 0,
          fuzzy: rrfBreakdown.fuzzy ?? 0,
          semantic: rrfBreakdown.semantic ?? 0
        },
        boostedScore,
        boosts,
        finalScore: boostedScore
      })
    }

    return rankedResults.sort((a, b) => b.finalScore - a.finalScore)
  }
}

export default new IllustrationSearchRanker()
