````markdown
# Hybrid Search - Quick Reference

## 🚀 Core Concept

**Fast candidate retrieval in SQL + Intelligent ranking in application**

---

## 📡 API Endpoints

### Search with all 4 methods

```
POST /api/search/hybrid
{
  "query": "machine learning",
  "embedding": [0.1, 0.2, ...],  // optional
  "limit": 20,
  "includeDetails": true
}
```

### Text-only search (no embedding)

```
POST /api/search/text-only
{
  "query": "machine learning",
  "limit": 20
}
```

### Debug: See retrieval stage

```
POST /api/search/candidates
{
  "query": "machine learning"
}
```

---

## 🔍 The 4 Search Methods

| Method        | Index              | Best For                | Latency |
| ------------- | ------------------ | ----------------------- | ------- |
| **FTS Title** | GIN (tsvector)     | Phrase match in title   | 10ms    |
| **FTS Body**  | GIN (tsvector)     | Phrase match in content | 10ms    |
| **Fuzzy**     | GIN (pg_trgm)      | Typos, variations       | 15ms    |
| **Semantic**  | IVFFlat (pgvector) | Meaning-based           | 30ms    |

All 4 run in **parallel** → candidiates merged → top-100 returned

---

## 🏆 RRF Formula (Application Layer)

```
score = w₁/(k + r₁) + w₂/(k + r₂) + w₃/(k + r₃) + w₄/(k + r₄)

Where:
  w₁ = 1.2  (FTS title weight)
  w₂ = 0.6  (FTS body weight)
  w₃ = 0.4  (Fuzzy weight)
  w₄ = 1.0  (Semantic weight)
  k = 60    (RRF constant)
  rᵢ = rank from method i (1-50)
```

---

## 📊 Boosting (Multiplicative)

Applied **AFTER** RRF:

```
boosted_score = rrf_score × recency_boost × affinity_boost × popularity_boost

Recency: Linear decay over 90 days → [1.0, 1.2]
Affinity: User preferences → [1.0, 1.5]
Popularity: Log(views) → [1.0, 1.1]
```

---

## ⚙️ Services

### HybridSearchService

**Independent retrieval only**

```typescript
const candidates = await hybridSearch.retrieve(query, embedding)
// Returns: [{ document_id, rank_fts_title?, rank_fts_body?, ... }]
// No scores - just rank positions!
```

### RankingService

**RRF + Boosting + Optional reranking**

```typescript
const ranker = new RankingService(config)
const results = await ranker.rank(candidates, illustrations)
// Returns: [{ document_id, rrf_score, boosted_score, final_score }]
```

### SearchIndexingService

**Async indexing (triggered on document change)**

```typescript
await indexingService.indexIllustration(id)
// Computes embedding + FTS vectors + upserts document_search
```

---

## 🎯 Integration Steps

1. **Run migrations**

   ```bash
   node ace migration:run
   ```

2. **Choose embedding provider**

   ```typescript
   new OllamaEmbeddingProvider() // Free, local
   new OpenAIEmbeddingProvider(key) // Proprietary
   new HuggingFaceEmbeddingProvider(k) // Balanced
   ```

3. **Hook illustrations**

   ```typescript
   @afterCreate()
   static async afterCreate(model: Illustration) {
     setImmediate(() => indexingService.indexIllustration(model.id))
   }
   ```

4. **Register routes**

   ```typescript
   router.post('/search/hybrid', 'HybridSearchController.search')
   ```

5. **Index existing documents**
   ```typescript
   await indexingService.reindexAll()
   ```

---

## 💾 Database

### Extensions Required

- `pgvector` - Vector similarity
- `pg_trgm` - Trigram fuzzy match

### Tables

- `illustrations` - Source of truth (mutable)
- `document_search` - Search index (async-updated)

### Indexes

- GIN on title_tsv
- GIN on body_tsv
- GIN on title_trigram
- IVFFlat on embedding

---

## 🧪 Test Queries

### Text search (immediate)

```bash
curl -X POST http://localhost:3333/api/search/text-only \
  -d '{"query": "neural networks"}'
```

### Full hybrid (with embedding)

```bash
curl -X POST http://localhost:3333/api/search/hybrid \
  -d '{"query": "neural networks", "embedding": [...]}'
```

---

## ⚡ Performance Targets

| Operation | Time      | Notes              |
| --------- | --------- | ------------------ |
| Retrieval | 50-150ms  | 4 parallel queries |
| Ranking   | <10ms     | RRF + boosting     |
| Embedding | 100-500ms | Provider-dependent |
| **Total** | 150-700ms | Typical end-to-end |

FTS only: **50-100ms** (no embedding)

---

## 🎛️ Configuration Examples

### Default (Conservative)

```typescript
weights: { fts_title: 1.2, fts_body: 0.6, fuzzy: 0.4, semantic: 1.0 }
boostFactors: { recency: 1.2, affinity: 1.5, popularity: 1.1 }
```

### Semantic Search

```typescript
weights: { fts_title: 0.8, fts_body: 0.4, fuzzy: 0.2, semantic: 2.0 }
```

### Typo-Tolerant

```typescript
weights: { fts_title: 0.8, fts_body: 0.4, fuzzy: 1.5, semantic: 1.0 }
```

---

## ❌ Never Violate These

| Don't                         | Why                          |
| ----------------------------- | ---------------------------- |
| Compute RRF in SQL            | Not all candidates available |
| Apply boosting in query       | Requires app context         |
| Combine scores in SQL         | Breaks modularity            |
| Compute embeddings in trigger | Blocks document creation     |
| Rank full table               | Unscalable                   |

---

## 🐛 Debugging

### Check if index is populated

```sql
SELECT COUNT(*) FROM document_search;
```

### Check index sizes

```sql
SELECT
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid))
FROM pg_indexes WHERE tablename = 'document_search';
```

### See retrieval breakdown

```bash
curl -X POST /api/search/candidates \
  -d '{"query": "test"}' \
  | jq '.candidates[] | {id, rank_title, rank_body, rank_fuzzy, rank_semantic}'
```

### Check embedding availability

```sql
SELECT COUNT(*) FROM document_search WHERE embedding IS NOT NULL;
```

---

## 📂 Files Location

```
api/
├── app/
│   ├── controllers/http/
│   │   └── HybridSearchController.ts
│   ├── services/
│   │   ├── hybrid_search_service.ts
│   │   ├── ranking_service.ts
│   │   ├── search_indexing_service.ts
│   │   └── embedding_providers.ts
│   ├── models/
│   │   └── document_search.ts
│   └── jobs/
│       └── index_illustration_job.ts
└── database/
    └── migrations/
        ├── 1760105000000_create_pgvector_extension.ts
        ├── 1760100000000_create_pg_trgm_extension.ts
        └── 1760110000000_create_document_search_table.ts
```

---

## 📚 Documentation

| Doc                             | Contains                   |
| ------------------------------- | -------------------------- |
| `HYBRID_SEARCH_SUMMARY.md`      | High-level overview        |
| `HYBRID_SEARCH_ARCHITECTURE.md` | Complete design + formulas |
| `HYBRID_SEARCH_INTEGRATION.md`  | Setup guide                |
| `HYBRID_SEARCH_EXAMPLES.ts`     | 10 working examples        |

---

## 💡 Key Insights

1. **Parallel Retrieval**: All 4 methods run simultaneously
2. **Candidate Union**: Top-50 from each → top-100 total
3. **Application Ranking**: RRF + boosting happen in app
4. **Async Indexing**: Documents searchable immediately (FTS), semantic after embedding
5. **Configurable**: Weights, boosts, thresholds all tunable
6. **Extensible**: Add reranking, caching, analytics easily

---

## 🚀 Launch Checklist

- [ ] Extensions created (pgvector, pg_trgm)
- [ ] document_search table created
- [ ] Services initialized
- [ ] Controller endpoints registered
- [ ] Illustration model hooks added
- [ ] Embedding provider running
- [ ] Existing documents indexed
- [ ] Search endpoints tested
- [ ] Performance verified
- [ ] Monitoring configured

---

**Ready to search!** 🎉
````
