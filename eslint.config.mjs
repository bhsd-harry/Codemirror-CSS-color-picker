import config, {browser} from '@bhsd/code-standard';

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
		files: ['test/src/*.ts'],
		languageOptions: {
			parserOptions: {
				project: './test/tsconfig.json',
			},
		},
	},
];
