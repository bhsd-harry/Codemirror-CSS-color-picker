import {dist} from '@bhsd/code-standard';
import esX from 'eslint-plugin-es-x';

export default [
	dist,
	{
		languageOptions: {
			ecmaVersion: 8,
		},
		rules: {
			...esX.configs['flat/no-new-in-es2018'].rules,
			...esX.configs['flat/no-new-in-es2019'].rules,
			...esX.configs['flat/no-new-in-es2020'].rules,
		},
	},
];
