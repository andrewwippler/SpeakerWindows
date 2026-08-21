/**
 * LocalEmbeddingProvider
 *
 * Uses @xenova/transformers with Xenova/all-MiniLM-L6-v2 model
 * Produces 384-dimensional vectors
 * Singleton pattern to avoid reloading model on every request
 */

import { pipeline, env, type FeatureExtractionPipeline } from '@xenova/transformers'
import type { EmbeddingProvider } from './search_indexing_service.js'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

env.allowLocalModels = true
env.allowRemoteModels = false
env.useBrowserCache = false
env.cacheDir = process.env.MODEL_CACHE_DIR || resolve(__dirname, '../../model-cache')

let pipelineInstance: FeatureExtractionPipeline | null = null

export class LocalEmbeddingProvider implements EmbeddingProvider {
  private static instance: LocalEmbeddingProvider | null = null
  private static initializing: Promise<void> | null = null
  private initializationError: Error | null = null

  private constructor() {}

  static getInstance(): LocalEmbeddingProvider {
    if (!LocalEmbeddingProvider.instance) {
      LocalEmbeddingProvider.instance = new LocalEmbeddingProvider()
    }
    return LocalEmbeddingProvider.instance
  }

  async embed(text: string): Promise<number[]> {
    if (this.initializationError) {
      throw this.initializationError
    }

    const pipelineFn = await this.getPipeline()
    const output = await pipelineFn(text, { pooling: 'mean', normalize: true })
    const data = output.data as Float32Array
    return Array.from(data)
  }

  private async getPipeline(): Promise<FeatureExtractionPipeline> {
    if (pipelineInstance) {
      return pipelineInstance
    }

    if (LocalEmbeddingProvider.initializing) {
      await LocalEmbeddingProvider.initializing
      if (this.initializationError) {
        throw this.initializationError
      }
      if (!pipelineInstance) {
        throw new Error('Pipeline initialization failed')
      }
      return pipelineInstance
    }

    LocalEmbeddingProvider.initializing = (async () => {
      try {
        pipelineInstance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
          quantized: false,
          revision: 'main',
        })
      } catch (error) {
        this.initializationError =
          error instanceof Error ? error : new Error('Failed to initialize embedding pipeline')
        throw this.initializationError
      }
    })()

    await LocalEmbeddingProvider.initializing
    return pipelineInstance!
  }

  async warmUp(): Promise<void> {
    await this.getPipeline()
  }
}

export default LocalEmbeddingProvider.getInstance()
