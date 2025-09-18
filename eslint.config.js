import globals from 'globals';
import pluginJs from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';

export default [
	{
		files: ['**/*.js'],
		languageOptions: {
			sourceType: 'module',
			globals: globals.node,
			ecmaVersion: 2025,
		},
	},
	{
		languageOptions: {
			globals: globals.es2025,
		},
	},
	{
		languageOptions: {
			globals: globals.browser,
		},
	},

	// https://github.com/eslint/eslint/blob/main/packages/js/src/configs/eslint-recommended.js
	pluginJs.configs.recommended,

	{
		rules: {
			'no-console': ['warn', { allow: ['warn', 'error'] }],
			'no-debugger': 'warn',
			'no-unused-vars': ['warn', {
				varsIgnorePattern: '^_',
				argsIgnorePattern: '^_',
				caughtErrorsIgnorePattern: '^_',
			}],

			'arrow-body-style': ['error', 'as-needed'],
			'arrow-parens': ['error', 'as-needed', { requireForBlockBody: true }],
			'curly': ['error', 'multi-line', 'consistent'],
			'eqeqeq': ['error', 'smart'],
			'func-name-matching': 'error',
			'func-names': ['error', 'as-needed'],
			'no-confusing-arrow': 'error',
			'no-duplicate-imports': 'error',
			'no-else-return': 'error',
			'no-lonely-if': 'error',
			'no-unused-expressions': ['error', { allowShortCircuit: true }],
			'no-use-before-define': ['error', { functions: false }],
			'prefer-const': ['error', { destructuring: 'all', ignoreReadBeforeAssign: true }],
			'prefer-template': 'error',
		},
	},

	{
		plugins: {
			'@stylistic': stylistic,
		},
		rules: {
			'@stylistic/indent': ['error', 'tab', { SwitchCase: 1 }],
			'@stylistic/quotes': ['error', 'single'],

			'@stylistic/array-bracket-newline': ['error', 'consistent'],
			'@stylistic/array-bracket-spacing': 'error',
			'@stylistic/array-element-newline': ['error', 'consistent'],
			'@stylistic/brace-style': ['error', 'stroustrup'],
			'@stylistic/comma-dangle': ['error', 'always-multiline'],
			'@stylistic/implicit-arrow-linebreak': 'error',
			'@stylistic/keyword-spacing': 'error',
			'@stylistic/linebreak-style': 'error',
			'@stylistic/no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1 }],
			'@stylistic/object-curly-spacing': ['error', 'always'],
			'@stylistic/operator-linebreak': ['error', 'before'],
			'@stylistic/quote-props': ['error', 'consistent-as-needed', { keywords: true }],
			'@stylistic/semi': 'error',
			'@stylistic/semi-style': 'error',
			'@stylistic/space-before-function-paren': ['error', {
				anonymous: 'never',
				named: 'never',
				asyncArrow: 'always',
			}],
			'@stylistic/switch-colon-spacing': 'error',
			'@stylistic/template-curly-spacing': 'error',
		},
	},

	{
		files: ['examples/**/*.js', 'scripts/**/*.js'],
		rules: {
			'no-console': 'off',
		},
	},
];
