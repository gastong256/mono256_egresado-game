// Read-only content inspection: deliberately does not load environment files.
import { fileURLToPath } from 'node:url'
export default {
  envDir: false,
  resolve: { alias: {
    '@': fileURLToPath(new URL('../../../../src', import.meta.url)),
    'server-only': fileURLToPath(new URL('../../../../tests/stubs/server-only.ts', import.meta.url)),
  } },
}
