import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: [
      'dist/**/*',
      'android/**/*',
      'node_modules/**/*',
      'src/**/*',
      'server.ts',
      '*.ts',
      '*.js',
      '*.mjs',
    ],
  },
  firebaseRulesPlugin.configs['flat/recommended'],
];
