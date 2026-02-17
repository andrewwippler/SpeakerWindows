/**
 * Hybrid Search Service (Internal)
 *
 * Internal retrieval service that returns candidate rankings only.
 * NOT exposed via public APIs.
 * Used by Illustration.search() static method.
 */

import db from '@adonisjs/lucid/services/db'

export interface CandidateRank {
  illustrationId: number
  ftsTitleRank?: number
  ftsBodyRank?: number
  fuzzyRank?: number
  semanticRank?: number
}

/**
 * Retrieve candidates from 4 independent methods
 * Returns: illustration IDs with rank positions from each method
 * Does NOT compute scores or apply ranking logic
 */
export class HybridSearchService {
  private readonly TOP_K = 50
  private readonly UNION_LIMIT = 100

  /**
   * Full-text search on title
   */
  private async retrieveFTS_Title(
    query: string
  ): Promise<{ illustrationId: number; rank: number }[]> {
    const queryVector = this.toTsQuery(query)

    const results = await db.rawQuery(
      `
      SELECT
        document_id as "illustrationId",
        ROW_NUMBER() OVER (ORDER BY ts_rank(title_tsv, to_tsquery('english', ?)) DESC) as rank
      FROM document_search
      WHERE title_tsv @@ to_tsquery('english', ?)
      ORDER BY ts_rank(title_tsv, to_tsquery('english', ?)) DESC
      LIMIT ?
    `,
      [queryVector, queryVector, queryVector, this.TOP_K]
    )

    return results.rows as { illustrationId: number; rank: number }[]
  }

  /**
   * Full-text search on body
   */
  private async retrieveFTS_Body(
    query: string
  ): Promise<{ illustrationId: number; rank: number }[]> {
    const queryVector = this.toTsQuery(query)

    const results = await db.rawQuery(
      `
      SELECT
        document_id as "illustrationId",
        ROW_NUMBER() OVER (ORDER BY ts_rank(body_tsv, to_tsquery('english', ?)) DESC) as rank
      FROM document_search
      WHERE body_tsv @@ to_tsquery('english', ?)
      ORDER BY ts_rank(body_tsv, to_tsquery('english', ?)) DESC
      LIMIT ?
    `,
      [queryVector, queryVector, queryVector, this.TOP_K]
    )

    return results.rows as { illustrationId: number; rank: number }[]
  }

  /**
   * Trigram fuzzy matching on title
   */
  private async retrieveFuzzy(query: string): Promise<{ illustrationId: number; rank: number }[]> {
    const results = await db.rawQuery(
      `
      SELECT
        document_id as "illustrationId",
        ROW_NUMBER() OVER (ORDER BY similarity(title_trigram, ?) DESC) as rank
      FROM document_search
      WHERE title_trigram % ?
      ORDER BY similarity(title_trigram, ?) DESC
      LIMIT ?
    `,
      [query, query, query, this.TOP_K]
    )

    return results.rows as { illustrationId: number; rank: number }[]
  }

  /**
   * Vector similarity search (semantic)
   */
  private async retrieveSemantic(
    embedding: number[]
  ): Promise<{ illustrationId: number; rank: number }[]> {
    const embeddingStr = '[' + embedding.join(',') + ']'

    const results = await db.rawQuery(
      `
      SELECT
        document_id as "illustrationId",
        ROW_NUMBER() OVER (ORDER BY embedding <-> ?::vector ASC) as rank
      FROM document_search
      WHERE embedding IS NOT NULL
      ORDER BY embedding <-> ?::vector ASC
      LIMIT ?
    `,
      [embeddingStr, embeddingStr, this.TOP_K]
    )

    return results.rows as { illustrationId: number; rank: number }[]
  }

  /**
   * Unified retrieval from all 4 methods
   * Returns candidates with per-method rank positions
   */
  async retrieve(query: string, embedding: number[]): Promise<CandidateRank[]> {
    const [fts_title, fts_body, fuzzy, semantic] = await Promise.all([
      this.retrieveFTS_Title(query),
      this.retrieveFTS_Body(query),
      this.retrieveFuzzy(query),
      this.retrieveSemantic(embedding),
    ])

    // Build candidate map with per-method ranks
    const candidateMap = new Map<number, CandidateRank>()

    // Merge all retrieval results
    for (const result of fts_title) {
      const candidate = candidateMap.get(result.illustrationId) || {
        illustrationId: result.illustrationId,
      }
      candidate.ftsTitleRank = result.rank
      candidateMap.set(result.illustrationId, candidate)
    }

    for (const result of fts_body) {
      const candidate = candidateMap.get(result.illustrationId) || {
        illustrationId: result.illustrationId,
      }
      candidate.ftsBodyRank = result.rank
      candidateMap.set(result.illustrationId, candidate)
    }

    for (const result of fuzzy) {
      const candidate = candidateMap.get(result.illustrationId) || {
        illustrationId: result.illustrationId,
      }
      candidate.fuzzyRank = result.rank
      candidateMap.set(result.illustrationId, candidate)
    }

    for (const result of semantic) {
      const candidate = candidateMap.get(result.illustrationId) || {
        illustrationId: result.illustrationId,
      }
      candidate.semanticRank = result.rank
      candidateMap.set(result.illustrationId, candidate)
    }

    // Return union of candidates (up to UNION_LIMIT)
    return Array.from(candidateMap.values()).slice(0, this.UNION_LIMIT)
  }

  private toTsQuery(query: string): string {
    return query
      .trim()
      .split(/\s+/)
      .filter((term) => term.length > 0)
      .join(' & ')
  }
}

export default new HybridSearchService()
