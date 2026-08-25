import type { InferAuthenticators } from '@adonisjs/auth/types'
import type authConfig from '#config/auth'

declare module '@adonisjs/auth/types' {
  interface Authenticators extends InferAuthenticators<typeof authConfig> {}
}
