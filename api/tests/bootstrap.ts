import { assert } from '@japa/assert'
import app from '@adonisjs/core/services/app'
import type { Config } from '@japa/runner/types'
import { pluginAdonisJS } from '@japa/plugin-adonisjs'
import testUtils from '@adonisjs/core/services/test_utils'
import { sessionApiClient } from '@adonisjs/session/plugins/api_client'
import { authApiClient } from '@adonisjs/auth/plugins/api_client'
import { authBrowserClient } from '@adonisjs/auth/plugins/browser_client'
import { sessionBrowserClient } from '@adonisjs/session/plugins/browser_client'

import { fileSystem } from '@japa/file-system'
import { apiClient } from '@japa/api-client'
import { browserClient } from '@japa/browser-client'

/**
 * This file is imported by the "bin/test.ts" entrypoint file
 */

/**
 * Configure Japa plugins in the plugins array.
 * Learn more - https://japa.dev/docs/runner-config#plugins-optional
 */
export const plugins: Config['plugins'] = [
  assert(),
  pluginAdonisJS(app),
    /**
   * Configures Japa's API client for making HTTP requests
   */
  apiClient(),
  /**
   * Adds support for reading/writing session data during requests
   */
  sessionApiClient(app),
  /**
   * Adds support for authenticating users during requests
   */
  authApiClient(app),
  /**
   * Allows reading and writing session data
   * via the browser context.
   */
  sessionBrowserClient(app),
  /**
   * Configures Playwright and creates a fresh browser
   * context before every test.
   */
  browserClient({
    runInSuites: ['browser'],
    contextOptions: { baseURL: 'http://localhost:3333' },
  }),

  /**
   * Allows reading and writing session data
   * via the browser context.
   */
  sessionBrowserClient(app),
  /**
   * Enables the loginAs method for authenticating
   * users during tests.
   */
  authBrowserClient(app),
  fileSystem(),
]

/**
 * Configure lifecycle function to run before and after all the
 * tests.
 *
 * The setup functions are executed before all the tests
 * The teardown functions are executer after all the tests
 */
export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = {
  setup: [() => testUtils.db().migrate()],
  teardown: [],
}

export const reporters: Config['reporters'] = {
  //  activated: ['ndjson'],
  activated: ['spec'],
}

/**
 * Configure suites by tapping into the test suite instance.
 * Learn more - https://japa.dev/docs/test-suites#lifecycle-hooks
 */
export const configureSuite: Config['configureSuite'] = (suite) => {
  if (['browser', 'functional', 'e2e'].includes(suite.name)) {
    return suite.setup(() => testUtils.httpServer().start())
  }
}
