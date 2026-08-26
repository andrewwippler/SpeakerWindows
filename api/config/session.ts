import { defineConfig, stores } from '@adonisjs/session'
import env from '#start/env'

const sessionDomain = env.get('SESSION_COOKIE_DOMAIN')

const sessionConfig = defineConfig({
  enabled: true,
  cookieName: 'sw_session',
  clearWithBrowser: false, // Set to false so cookies persist through redirects/reopens
  age: '2h',
  cookie: {
    ...(sessionDomain ? { domain: sessionDomain } : {}), // Pass domain ONLY if set
    path: '/',
    httpOnly: true,
    secure: env.get('NODE_ENV') === 'production',
    sameSite: 'lax',
  },
  store: env.get('SESSION_DRIVER', 'cookie') as 'cookie',
  stores: {
    cookie: stores.cookie(),
  },
})

export default sessionConfig
