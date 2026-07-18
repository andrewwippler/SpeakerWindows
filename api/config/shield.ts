import { defineConfig } from '@adonisjs/shield'

const shieldConfig = defineConfig({
  csrf: false,

  csp: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://avatars.githubusercontent.com'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
    },
  },

  xssFilter: {
    enabled: true,
  },

  contentTypeSniff: {
    enabled: true,
  },
})

export default shieldConfig
