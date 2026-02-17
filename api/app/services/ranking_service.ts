/**
 * RankingService
 *
 * Application-layer ranking with:
 * - Reciprocal Rank Fusion (RRF) computation
 * - Multiplicative boosting (recency, user affinity, popularity)
 * - RRF formula: score = Σ(weight / (k + rank)) for each retrieval method
 *
 * Works with CandidateRank[] from HybridSearchService
 */

import { CandidateRank } from './hybrid_search_service.js'
import Illustration from '#models/illustration'

export interface RankerConfig {
  weights?: {
    fts_title?: number
    fts_body?: number
    fuzzy?: number
    semantic?: number
  }
  k?: number // RRF denominator (default: 60)
  boostFactors?: {
    enabled?: boolean
    recency?: number
    userAffinity?: number
    popularity?: number
  }
}

export interface RequiredRankerConfig {
  weights: {
    fts_title: number
    fts_body: number
    fuzzy: number
    semantic: number
  }
  k: number
  boostFactors: {
    enabled: boolean
    recency: number
    userAffinity: number
    popularity: number
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
 * Service to rank illustrations using RRF + multiplicative boosting
 */
export class RankingService {
  private config: RequiredRankerConfig

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
   * RRF = Σ weight / (k + rank) for each retrieval method where rank is defined
   */
  private computeRRF(candidate: CandidateRank): { score: number; breakdown: Record<string, number> } {
    const breakdown: Record<string, number> = {}
    let score = 0
    const weights = this.config.weights
    const k = this.config.k

    if (candidate.ftsTitleRank !== undefined) {
      const contribution = weights.fts_title / (k + candidate.ftsTitleRank)
      breakdown.fts_title = contribution
      score += contribution
    } else {
      breakdown.fts_title = 0
    }

    if (candidate.ftsBodyRank !== undefined) {
      const contribution = weights.fts_body / (k + candidate.ftsBodyRank)
      breakdown.fts_body = contribution
      score += contribution
    } else {
      breakdown.fts_body = 0
    }

    if (candidate.fuzzyRank !== undefined) {
      const contribution = weights.fuzzy / (k + candidate.fuzzyRank)
      breakdown.fuzzy = contribution
      score += contribution
    } else {
      breakdown.fuzzy = 0
    }

    if (candidate.semanticRank !== undefined) {
      const contribution = weights.semantic / (k + candidate.semanticRank)
      breakdown.semantic = contribution
      score += contribution
    } else {
      breakdown.semantic = 0
    }

    return { score, breakdown }
  }

  /**
   * Apply multiplicative boosting to RRF score
   *
   * Final = RRF × recencyBoost × affinityBoost × popularityBoost
   */
  private applyBoosting(
    rrfScore: number,
    illustration: Illustration
  ): { score: number; boosts: { recency: number; userAffinity: number; popularity: number } } {
    const boosts = {
      recency: this.computeRecencyBoost(illustration.createdAt),
      userAffinity: this.config.boostFactors.userAffinity,
      popularity: 1.0 // Can be extended with view_count if available
    }

    const score = rrfScore * boosts.recency * boosts.userAffinity * boosts.popularity

    return { score, boosts }
  }

  /**
   * Recency boost: Linear decay over 90 days
   *
   * At 0 days: recency factor (e.g., 1.2)
   * At 90 days: 1.0 (no boost)
   */
  private computeRecencyBoost(createdAt: any): number {
    if (!createdAt) return 1.0

    const days = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
    const maxDays = 90
    const recencyFactor = this.config.boostFactors.recency

    if (days <= 0) return recencyFactor
    if (days >= maxDays) return 1.0

    // Linear interpolation
    return 1.0 + (recencyFactor - 1.0) * (1 - days / maxDays)
  }

  /**
   * Rank illustrations with RRF + boosting
   *
   * @param candidates - CandidateRank[] from HybridSearchService
   * @param illustrations - Map of illustrationId -> Illustration instances
   * @returns RankedIllustration[] sorted by final score descending
   */
  async rank(
    candidates: CandidateRank[],
    illustrations: Map<string | number, Illustration>
  ): Promise<RankedIllustration[]> {
    const rankedResults: RankedIllustration[] = []

    for (const candidate of candidates) {
      // Try both string and number keys to handle both test fixtures and production
      let illustration = illustrations.get(String(candidate.illustrationId))
      if (!illustration) {
        illustration = illustrations.get(candidate.illustrationId as any)
      }
      if (!illustration) continue

      // Step 1: Compute RRF
      const { score: rrfScore, breakdown: rrfBreakdown } = this.computeRRF(candidate)

      // Step 2: Apply boosting
      let boostedScore = rrfScore
      let boosts = { recency: 1.0, userAffinity: 1.0, popularity: 1.0 }

      if (this.config.boostFactors.enabled) {
        const boosted = this.applyBoosting(rrfScore, illustration)
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

    // Sort by final score descending
    return rankedResults.sort((a, b) => b.finalScore - a.finalScore)
  }
}

export default new RankingService()
