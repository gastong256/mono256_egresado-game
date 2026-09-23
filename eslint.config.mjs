import { defineConfig, globalIgnores } from 'eslint/config'
import boundaries from 'eslint-plugin-boundaries'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypeScript from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier/flat'

const serverImportPattern = '^(?:@/server|(?:\\.\\./)+(?:.*?/)?server)(?:/|$)'
const serverEnvironmentImportPattern =
  '^(?:@/config/env\\.server|(?:\\.\\./)+(?:.*?/)?config/env\\.server)$'
const persistenceImportPattern =
  '^(?:@/server/persistence|(?:\\.\\./)+(?:.*?/)?server/persistence)(?:/|$)'
const supabaseAdapterImportPattern =
  '^(?:@/lib/supabase|(?:\\.\\./)+(?:.*?/)?lib/supabase)(?:/|$)'
const gameForbiddenImportPattern =
  '^(?:@/(?:app|components|content|server|config|lib)|(?:\\.\\./)+(?:.*?/)?(?:app|components|content|server|config|lib))(?:/|$)'
const appDynamicImportRestriction = {
  selector:
    "ImportExpression[source.value='@supabase/supabase-js'], ImportExpression[source.value=/^@[/]server[/]persistence(?:[/]|$)/], ImportExpression[source.value='@/config/env.server'], ImportExpression[source.value=/^@[/]lib[/]supabase(?:[/]|$)/], ImportExpression[source.value=/^(?:\\.\\.\\/)+(?:.*?\\/)?server\\/persistence(?:\\/|$)/], ImportExpression[source.value=/^(?:\\.\\.\\/)+(?:.*?\\/)?config\\/env\\.server$/], ImportExpression[source.value=/^(?:\\.\\.\\/)+(?:.*?\\/)?lib\\/supabase(?:\\/|$)/]",
  message:
    'App routes cannot dynamically import persistence internals, Supabase adapters, or server environment configuration.',
}

export default defineConfig([
  // `.tmp/` es el área de trabajo local de handoffs (planes, evidencia de
  // discovery); no es producto y no pasa por los gates de código.
  globalIgnores(['.tmp/**']),
  ...nextVitals,
  ...nextTypeScript,
  {
    files: ['src/**/*.{ts,tsx,mts}'],
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    plugins: {
      boundaries,
    },
    settings: {
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**' },
        { type: 'components', pattern: 'src/components/**' },
        { type: 'game', pattern: 'src/game/**' },
        { type: 'content', pattern: 'src/content/**' },
        { type: 'release', pattern: 'src/release/**' },
        { type: 'server', pattern: 'src/server/**' },
        { type: 'lib', pattern: 'src/lib/**' },
        { type: 'config', pattern: 'src/config/**' },
        { type: 'config', pattern: 'src/types/**' },
      ],
      'boundaries/files': [
        {
          category: 'framework-entry',
          pattern: ['src/instrumentation.ts', 'src/proxy.ts'],
        },
      ],
    },
    rules: {
      'boundaries/no-unknown-dependencies': 'error',
      'boundaries/no-unknown-files': 'error',
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          message: '{{from.type}} must not depend on {{to.type}}',
          policies: [
            {
              from: { element: { type: 'app' } },
              allow: { to: { module: { origin: 'external' } } },
            },
            {
              from: { element: { type: 'components' } },
              allow: { to: { module: { origin: 'external' } } },
            },
            {
              from: { element: { type: 'content' } },
              allow: { to: { module: { origin: 'external' } } },
            },
            {
              from: { element: { type: 'release' } },
              allow: { to: { module: { origin: 'external' } } },
            },
            {
              from: { element: { type: 'server' } },
              allow: { to: { module: { origin: 'external' } } },
            },
            {
              from: { element: { type: 'lib' } },
              allow: { to: { module: { origin: 'external' } } },
            },
            {
              from: { element: { type: 'config' } },
              allow: { to: { module: { origin: 'external' } } },
            },
            {
              from: { element: { type: 'app' } },
              allow: {
                to: {
                  element: {
                    types: {
                      anyOf: [
                        'app',
                        'components',
                        'game',
                        'server',
                        'lib',
                        'config',
                        'release',
                      ],
                    },
                  },
                },
              },
            },
            // The framework entries are Next's own hooks: the boot check and
            // the per-request nonce. They compose what already exists — the
            // environment, the release identity, the header policy — and own no
            // rule of their own.
            {
              from: { file: { categories: 'framework-entry' } },
              allow: {
                to: {
                  element: {
                    types: { anyOf: ['config', 'release', 'lib'] },
                  },
                },
              },
            },
            {
              from: { element: { type: 'components' } },
              allow: {
                to: {
                  element: {
                    // Gameplay is local-first (ADR-006), so the authored content
                    // set has to reach the browser. Content is data over
                    // existing interactions (ADR-007) and decides no UI or
                    // persistence, so the client composition root may import it.
                    types: { anyOf: ['components', 'content', 'game', 'lib'] },
                  },
                },
              },
            },
            {
              from: { element: { type: 'game' } },
              allow: { to: { element: { type: 'game' } } },
            },
            // The deterministic core stays framework and environment
            // independent, but may use pure, portable libraries. The allowlist
            // is explicit so a heavier dependency cannot slip into replay-
            // critical code: `zod` parses trust boundaries and `pure-rand`
            // provides the seeded generator fixed by ADR-011.
            {
              from: { element: { type: 'game' } },
              allow: {
                to: { module: { origin: 'external', source: 'zod' } },
              },
            },
            {
              from: { element: { type: 'game' } },
              allow: {
                to: { module: { origin: 'external', source: 'pure-rand' } },
              },
            },
            {
              from: { element: { type: 'game' } },
              allow: {
                to: { module: { origin: 'external', source: 'pure-rand/*' } },
              },
            },
            {
              from: { element: { type: 'content' } },
              allow: {
                to: {
                  element: { types: { anyOf: ['content', 'game', 'lib'] } },
                },
              },
            },
            // The release manifest is frozen product semantics, so it may name
            // the engine's identity primitives and nothing else. It deliberately
            // cannot reach `config`: a release that could read the environment
            // would stop being the same release on two deployments.
            {
              from: { element: { type: 'release' } },
              allow: { to: { element: { type: 'game' } } },
            },
            {
              from: { element: { type: 'server' } },
              allow: {
                to: {
                  element: {
                    types: {
                      anyOf: [
                        'server',
                        'game',
                        'content',
                        'lib',
                        'config',
                        'release',
                      ],
                    },
                  },
                },
              },
            },
            {
              from: { element: { type: 'lib' } },
              allow: {
                to: { element: { types: { anyOf: ['lib', 'config'] } } },
              },
            },
            {
              from: { element: { type: 'config' } },
              allow: { to: { element: { type: 'config' } } },
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx,mts}'],
    ignores: [
      'src/lib/supabase/public-client.ts',
      'src/server/persistence/supabase/*.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@supabase/supabase-js',
              message: 'Import Supabase only through an approved adapter.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/game/**/*.{ts,tsx,mts}'],
    rules: {
      'no-restricted-globals': [
        'error',
        'Date',
        'window',
        'document',
        'navigator',
        'fetch',
        'WebSocket',
        'localStorage',
        'sessionStorage',
        'globalThis',
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            'react',
            'react-dom',
            'next',
            '@supabase/supabase-js',
            'server-only',
          ],
          patterns: [
            {
              regex: gameForbiddenImportPattern,
              message:
                'The game core must remain framework and infrastructure independent.',
            },
            {
              regex: '^(?:react|react-dom|next|@supabase)(?:/|$)',
              message:
                'The game core cannot import framework or infrastructure packages.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ImportExpression',
          message:
            'The deterministic game core cannot load dependencies dynamically.',
        },
        {
          selector: 'JSXElement, JSXFragment',
          message:
            'The portable game core cannot contain JSX or depend on a UI runtime.',
        },
        {
          selector:
            "MemberExpression[object.name='Math'][property.name='random'], MemberExpression[object.name='Math'][property.value='random']",
          message:
            'Inject a versioned deterministic RNG instead of using Math.random().',
        },
        {
          selector:
            "VariableDeclarator[init.name='Math'], AssignmentExpression[right.name='Math']",
          message:
            'Do not alias the global Math object; call deterministic numeric methods directly and inject RNG.',
        },
      ],
    },
  },
  {
    files: ['src/server/practice/**/*.{ts,tsx,mts}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@supabase/supabase-js',
              message: 'Practice only receives the security counter port.',
            },
          ],
          patterns: [
            {
              regex:
                '^(?:@/server|(?:\\.\\./)+(?:.*?/)?server)/competition(?:/|$)|^(?:\\.\\./)+competition(?:/|$)',
              message:
                'Practice cannot access competitive use cases or sessions.',
            },
            {
              regex:
                '^(?:@/server/persistence|(?:\\.\\./)+persistence)/(?!supabase/rate-limit-counter$)',
              message:
                'Practice persistence is limited to the rate-limit counter adapter.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ImportExpression',
          message:
            'Practice server dependencies must be statically reviewable.',
        },
      ],
    },
  },
  {
    files: ['src/components/**/*.{ts,tsx,mts}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@supabase/supabase-js',
              message: 'UI cannot access persistence directly.',
            },
          ],
          patterns: [
            {
              regex: serverImportPattern,
              message: 'UI cannot import server modules.',
            },
            {
              regex: serverEnvironmentImportPattern,
              message: 'UI cannot import server environment configuration.',
            },
            {
              regex: supabaseAdapterImportPattern,
              message:
                'UI must use an application adapter instead of Supabase directly.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "ImportExpression[source.value='@supabase/supabase-js'], ImportExpression[source.value=/^@[/]lib[/]supabase(?:[/]|$)/], ImportExpression[source.value=/^(?:\\.\\.\\/)+(?:.*?\\/)?lib\\/supabase(?:\\/|$)/]",
          message:
            'UI must use an application adapter instead of dynamically importing Supabase.',
        },
      ],
    },
  },
  {
    files: ['src/app/**/*.{ts,tsx,mts}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@supabase/supabase-js',
              message:
                'App routes must use server use cases, not Supabase directly.',
            },
          ],
          patterns: [
            {
              regex: persistenceImportPattern,
              message:
                'App routes cannot import persistence internals directly.',
            },
            {
              regex: serverEnvironmentImportPattern,
              message:
                'App routes must receive validated configuration through server use cases.',
            },
            {
              regex: supabaseAdapterImportPattern,
              message:
                'App routes must use server use cases instead of Supabase adapters.',
            },
          ],
        },
      ],
      'no-restricted-syntax': ['error', appDynamicImportRestriction],
    },
  },
  {
    files: ['src/app/**/*.{ts,tsx,mts}'],
    ignores: ['src/app/**/error.tsx', 'src/app/global-error.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        appDynamicImportRestriction,
        {
          selector: "ExpressionStatement[expression.value='use client']",
          message:
            'Keep app routing/composition server-first; place interactive Client Components in src/components.',
        },
      ],
    },
  },
  prettier,
  globalIgnores([
    '.next/**',
    'coverage/**',
    'docs/EGRESADO-MASTER-SPEC.md',
    'node_modules/**',
    'playwright-report/**',
    'supabase/.branches/**',
    'supabase/.temp/**',
    'test-results/**',
  ]),
])
