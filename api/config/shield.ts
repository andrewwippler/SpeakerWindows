import { defineConfig } from '@adonisjs/shield'

const shieldConfig = defineConfig({
  csrf: {
    enabled: true,
    // EXPLICITLY ALLOW GET & HEAD TO BYPASS VALIDATION
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
    exceptRoutes: (ctx) => {
      const pathname = (ctx.request.parsedUrl.pathname || '').replace(/^\//, '')
      return pathname.startsWith('api') || pathname.startsWith('uploads')
    },
  },

  csp: {
    enabled: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        'https://unpkg.com',
        'https://cdn.jsdelivr.net',
      ],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://avatars.githubusercontent.com'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
    },
  },

  contentTypeSniffing: {
    enabled: true,
  },
})

export default shieldConfig
