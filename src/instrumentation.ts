export async function register() {
  if (process.env['NEXT_RUNTIME'] !== 'nodejs') {
    return
  }

  const { getServerEnvironment } = await import('@/config/env.server')
  getServerEnvironment()
}
