/**
 * cache-model.mjs
 *
 * Downloads the Xenova/all-MiniLM-L6-v2 model to a local cache directory.
 * Run during Docker build or manually to pre-populate the model cache.
 *
 * Usage: MODEL_CACHE_DIR=./model-cache node scripts/cache-model.mjs
 */
import { pipeline, env } from '@xenova/transformers'
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const cacheDir = process.env.MODEL_CACHE_DIR || resolve(__dirname, '..', 'model-cache')

mkdirSync(cacheDir, { recursive: true })

env.allowLocalModels = false
env.allowRemoteModels = true
env.cacheDir = cacheDir

console.log(`Caching model to ${cacheDir}...`)

const pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
  quantized: false,
  revision: 'main',
})

const result = await pipe('warm up', { pooling: 'mean', normalize: true })
console.log(`Model cached. Output dim: ${result.dims}`)
