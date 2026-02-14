You are a senior test engineer working on an AdonisJS hybrid search system.

Read the task file below and implement the required unit test file using japa test runners.

Return only the test file.

----- TASK FILE -----

TASK: Improve Test Coverage To Meet CI Threshold

Current CI failure:

Coverage for lines (86.36%) does not meet global threshold (90%)
Coverage for statements (86.36%) does not meet global threshold (90%)


Primary uncovered file:

app/services/illustration_search_ranker.ts
0% statements
0% branches
206 uncovered lines


This file implements:

Reciprocal Rank Fusion (RRF)

semantic weighting

fuzzy weighting

lexical weighting

recency boost

user boost

GOAL

Raise:

illustration_search_ranker.ts ≥ 90% statement coverage
illustration_search_ranker.ts ≥ 80% branch coverage


WITHOUT:

mocking ranking logic

bypassing score calculation

using snapshots

REQUIRED TEST SCENARIOS

Create:

tests/unit/illustration_search_ranker.spec.ts


Test:

RRF behaviour

candidate appearing in multiple lists outranks single-list candidate

lower rank_ix produces higher score

Missing rank handling

When:

ftsTitleRank = null
semanticRank = present


Ensure:

score still calculated

Weight influence

Increasing:

semanticWeight


should promote semantic-only candidate above lexical-only candidate.

k smoothing

Changing:

k from 60 to 10


must change ordering.

Boosting logic

Test:

recencyBoost applied

userBoost applied

combined boost applied

Ensure:

Boost multiplies final score, not intermediate score.

Empty input safety

Ensure:

rank([])


returns empty array.

Deterministic ordering

Same input must always produce same ordering.

OUTPUT

Generate only:

tests/unit/illustration_search_ranker.spec.ts


Do not modify application code.