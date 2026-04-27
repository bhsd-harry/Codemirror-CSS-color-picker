import fs from 'fs';
import esbuild from 'esbuild';

const /** @type {esbuild.Plugin} */ plugin = {
	name: 'alias',
	setup(build) {
		build.onLoad(
			{filter: /\/color-parse\/index\.js$/}, // eslint-disable-line require-unicode-regexp
			({path: p}) => ({
				contents: fs.readFileSync(p, 'utf8')
					.replace("import names from 'color-name'", 'const names = {}'),
			}),
		);
	},
};

const /** @type {esbuild.BuildOptions} */ config = {
	entryPoints: ['src/index.ts'],
	outfile: 'build/index.js',
	charset: 'utf8',
	bundle: true,
	target: 'es2017',
	format: 'esm',
	logLevel: 'info',
	plugins: [plugin],
	external: [
		'@bhsd/common',
		'@codemirror/language',
		'@codemirror/view',
		'@lezer/common',
		'color-name',
		'color-space',
	],
};

await esbuild.build(config);
