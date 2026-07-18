/*
|--------------------------------------------------------------------------
| Define HTTP rate limiters
|--------------------------------------------------------------------------
|
| The "Limiter.define" method callback receives an instance of the HTTP
| context you can use to customize the allowed requests and duration
| based upon the user of the request.
|
*/
import limiter from '@adonisjs/limiter/services/main'

export const throttle = limiter.define('global', () => {
  const isTest = process.env.NODE_ENV === 'test'
  return limiter.allowRequests(isTest ? 100000 : 1000).every(isTest ? '1 hour' : '1 minute')
})

export const authThrottle = limiter.define('auth', () => {
  const isTest = process.env.NODE_ENV === 'test'
  if (isTest) {
    return limiter.allowRequests(100000).every('1 hour')
  }
  return limiter.allowRequests(5).every('5 minutes').blockFor('30 minutes')
})

export const contactThrottle = limiter.define('contact', () => {
  const isTest = process.env.NODE_ENV === 'test'
  return limiter.allowRequests(isTest ? 100000 : 10).every('1 hour')
})

export const importThrottle = limiter.define('import', () => {
  const isTest = process.env.NODE_ENV === 'test'
  return limiter.allowRequests(isTest ? 100000 : 5).every('1 hour')
})

export const uploadThrottle = limiter.define('upload', () => {
  const isTest = process.env.NODE_ENV === 'test'
  return limiter.allowRequests(isTest ? 100000 : 20).every('1 hour')
})
