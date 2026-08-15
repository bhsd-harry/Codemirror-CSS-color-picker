import config, {browserES10} from '@bhsd/code-standard';

export default [
	{
		ignores: ['**/*.js'],
	},
	...config,
	browserES10,
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
];
