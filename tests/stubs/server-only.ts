/**
 * Test stub for the `server-only` guard.
 *
 * `server-only` deliberately throws when it is resolved outside a React Server
 * Component build. Vitest has no such build, so importing a server module in a
 * test would fail on the guard rather than on anything real.
 *
 * Aliasing it here keeps server modules testable. It does not weaken the
 * guarantee: the guard exists to fail the *application* bundle when a client
 * component imports server code, and that build is unaffected by this alias.
 */

export {}
