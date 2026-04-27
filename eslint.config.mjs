import config, {browser} from '@bhsd/code-standard';
import esX from 'eslint-plugin-es-x';

export default [
	{
		ignores: ['**/*.js'],
	},
	...config,
	browser,
	{
		files: ['**/*.ts'],
		rules: {
			'@typescript-eslint/no-shadow': [
				2,
				{
					builtinGlobals: true,
					allow: [
						'length',
						'name',
						'Range',
						'Text',
					],
				},
			],
		},
	},
	{
		files: ['src/*.ts'],
		...esX.configs['flat/restrict-to-es2017'],
	},
	{
		files: ['src/*.ts'],
		rules: {
			'prefer-object-has-own': 0,
			'es-x/no-optional-chaining': 0,
			'es-x/no-rest-spread-properties': 0,
		},
	},
	{
		files: ['test/src/*.ts'],
		languageOptions: {
			parserOptions: {
				project: './test/tsconfig.json',
			},
		},
	},
];
