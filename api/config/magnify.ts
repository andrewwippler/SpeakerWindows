import Illustration from '#models/illustration'
import env from '#start/env'
import { defineConfig, engines } from '@foadonis/magnify'

const magnifyConfig = defineConfig({
  default: 'typesense',
  engines: {
    typesense: engines.typesense({
      apiKey: env.get('TYPESENSE_API_KEY'),
      nodes: [
        {
          url: env.get('TYPESENSE_NODE_URL'),
        },
      ],
      collectionSettings: {
        illustrations: {
          queryBy: ['title', 'content', 'author'],
          fields: [
            {
              name: 'title',
              type: 'string',
            },
            {
              name: 'content',
              type: 'string',
            },
            {
              name: 'author',
              type: 'string',
            },
            {
              name: 'user_id',
              type: 'int32',
              optional: true,
            },
            {
              name: 'updatedAt',
              type: 'string',
            },
            {
              name: 'createdAt',
              type: 'string',
            },
          ],
        },
        tags: {
          queryBy: ['name'],
          fields: [
            {
              name: 'name',
              type: 'string',
            },
            {
              name: 'user_id',
              type: 'int32',
              optional: true,
            },
          ],
        }
      },

    }),
  },
})

export default magnifyConfig

/**
 * Inferring types for the list of engines you have configured
 * in your application.
 */
declare module '@foadonis/magnify/types' {
  export interface EnginesList extends InferEngines<typeof magnifyConfig> {}
}