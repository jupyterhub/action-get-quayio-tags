// https://eslint.org/docs/latest/use/configure/migration-guide#start-using-flat-config-files

import globals from 'globals'
import js from '@eslint/js'

export default [
  js.configs.recommended,
  {
    ignores: ['coverage/**', 'dist/*', 'lib/*', 'node_modules/*']
  },
  {
    files: ['**/*.*js'],
    languageOptions: {
      globals: {
        ...globals.node
      },

      // https://node.green/#ES2022
      ecmaVersion: 2022,
      sourceType: 'module'
    }
  }
]
