import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

// Clean Architecture boundaries: dependencies point inwards only.
const restrict = (...patterns) => ({
  'no-restricted-imports': ['error', { patterns }],
})

const frameworkFree = {
  group: ['vue', 'vue/*', 'pinia', '@vue/*', 'vue-i18n'],
  message: 'Core, i18n and the web application layer must stay framework-agnostic.',
}
const notApplication = {
  group: ['**/application/**', '**/application'],
  message: 'Domain must not depend on the application layer.',
}
const notInfrastructure = {
  group: ['**/infrastructure/**', '**/infrastructure'],
  message: 'Depend on ports; concrete implementations are wired in the composition root.',
}
const notPresentation = {
  group: ['**/presentation/**', '**/presentation'],
  message: 'Only presentation knows about presentation.',
}

const notHttp = {
  group: ['**/http/**', '**/http'],
  message: 'Only the composition root and the http layer know about HTTP.',
}

const boundaries = [
  { files: ['packages/core/src/domain/**'], rules: restrict(frameworkFree, notApplication) },
  { files: ['packages/core/src/application/**'], rules: restrict(frameworkFree) },
  { files: ['packages/i18n/src/**'], rules: restrict(frameworkFree) },
  {
    files: ['apps/web/src/application/**'],
    rules: restrict(frameworkFree, notInfrastructure, notPresentation),
  },
  { files: ['apps/web/src/presentation/**'], rules: restrict(notInfrastructure) },
  { files: ['apps/web/src/infrastructure/**'], rules: restrict(notPresentation) },
  // Worker: http is its presentation layer.
  { files: ['apps/worker/src/application/**'], rules: restrict(notInfrastructure, notHttp) },
  { files: ['apps/worker/src/http/**'], rules: restrict(notInfrastructure) },
  { files: ['apps/worker/src/infrastructure/**'], rules: restrict(notHttp) },
]

export default tseslint.config(
  { ignores: ['**/dist/**', '**/coverage/**', '**/worker-configuration.d.ts', '**/.wrangler/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
    },
  },
  {
    files: ['apps/web/**'],
    languageOptions: { globals: globals.browser },
  },
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      // Type-based optional props are `undefined` by default; forcing defaults adds noise.
      'vue/require-default-prop': 'off',
    },
  },
  ...boundaries,
  prettier,
)
