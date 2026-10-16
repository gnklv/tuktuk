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
  message: 'Core and i18n must stay framework-agnostic: they are shared with the server.',
}
const notApplication = {
  group: ['**/application/**', '**/application'],
  message: 'Domain must not depend on the application layer.',
}
const notInfrastructure = {
  group: ['**/infrastructure/**', '**/infrastructure'],
  message: 'Presentation must not import infrastructure. Inject it from main.ts instead.',
}
const notPresentation = {
  group: ['**/presentation/**', '**/presentation'],
  message: 'Infrastructure must not depend on presentation.',
}

const boundaries = [
  { files: ['packages/core/src/domain/**'], rules: restrict(frameworkFree, notApplication) },
  { files: ['packages/core/src/application/**'], rules: restrict(frameworkFree) },
  { files: ['packages/i18n/src/**'], rules: restrict(frameworkFree) },
  { files: ['apps/web/src/presentation/**'], rules: restrict(notInfrastructure) },
  { files: ['apps/web/src/infrastructure/**'], rules: restrict(notPresentation) },
]

export default tseslint.config(
  { ignores: ['**/dist/**', '**/coverage/**'] },
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
