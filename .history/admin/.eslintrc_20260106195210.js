module.exports = {
  root: true,
  env: { es6: true, node: true },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'google'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['tsconfig.json', 'tsconfig.dev.json'],
    sourceType: 'module'
  },
  ignorePatterns: ['/lib/**/*', '/generated/**/*'],
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    quotes: ['error', 'double'],
    'import/no-unresolved': 0,
    indent: ['error', 2]
    // Đã xóa 'react-refresh/only-export-components': 'warn'
  }
}
