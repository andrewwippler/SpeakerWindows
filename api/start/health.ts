import { HealthChecks, DiskSpaceCheck, MemoryHeapCheck } from '@adonisjs/core/health'

export const healthChecks = new HealthChecks().register([
  new DiskSpaceCheck().warnWhenExceeds(90).failWhenExceeds(95),
  new MemoryHeapCheck(),
])
