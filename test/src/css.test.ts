import assert from 'assert';
import {Text} from '@codemirror/state';
import {cssLanguage} from '@codemirror/lang-css';
import {htmlLanguage} from '@codemirror/lang-html';
import {namedColors} from '@bhsd/common';
import {parseCallExpression, parseColorLiteral, parseNamedColor} from '../../dist/color.js';
import {discoverColorsInCSS} from '../../dist/css.js';
import type {RGB, ColorData, WidgetOptions} from '../../dist/types';

const rgbTest = (rgb: RGB, expected = rgb): void => {
	const rgbStr = rgb.map(c => c > 0 && c < 1 ? `${c * 100}%` : String(c));
	for (const fn of ['rgb', 'RGB', 'rgba', 'RGBA']) {
		const exp = `${fn}( ${rgbStr.join()} )`;
		assert.deepStrictEqual(
			parseCallExpression(exp),
			{
				color: expected,
				alpha: 1,
				colorType: fn.toLowerCase() as 'rgb' | 'rgba',
				legacy: true,
				spaced: true,
			} satisfies ColorData,
			exp,
		);
	}
	for (const delimiter of [',', ' ', ', ']) {
		const exp = `rgb(${rgbStr.join(delimiter)})`;
		assert.deepStrictEqual(
			parseCallExpression(exp),
			{
				color: expected,
				alpha: 1,
				colorType: 'rgb',
				legacy: delimiter !== ' ',
				spaced: delimiter !== ',',
			} satisfies ColorData,
			exp,
		);
	}
	for (const alpha of ['0.555', '.555', '55.5%']) {
		for (const delimiter of [',', ', ']) {
			const exp = `rgb(${rgbStr.join(delimiter)},${alpha})`;
			assert.deepStrictEqual(
				parseCallExpression(exp),
				{
					color: expected,
					alpha: 0.555,
					colorType: 'rgb',
					legacy: true,
					spaced: delimiter === ', ',
				} satisfies ColorData,
				exp,
			);
		}
		const exp = `rgb(${rgbStr.join(' ')} / ${alpha})`;
		assert.deepStrictEqual(
			parseCallExpression(exp),
			{
				color: expected,
				alpha: 0.555,
				colorType: 'rgb',
				legacy: false,
				spaced: true,
			} satisfies ColorData,
			exp,
		);
	}
};

const hslTest = (hsl: RGB, expected: RGB): void => {
	const [h, s, l] = hsl,
		hslStr = [`${h}deg`, `${s}%`, `${l}%`];
	for (const fn of ['hsl', 'HSL', 'hsla', 'HSLA']) {
		let exp = `${fn}( ${hsl.map(String).join(' ')} )`;
		assert.deepStrictEqual(
			parseCallExpression(exp),
			{
				color: expected,
				alpha: 1,
				colorType: fn.toLowerCase() as 'hsl' | 'hsla',
				legacy: false,
				spaced: true,
			} satisfies ColorData,
			exp,
		);
		exp = `${fn}( ${hslStr.join(', ')} )`;
		assert.deepStrictEqual(
			parseCallExpression(exp),
			{
				color: expected,
				alpha: 1,
				colorType: fn.toLowerCase() as 'hsl' | 'hsla',
				legacy: true,
				spaced: true,
			} satisfies ColorData,
			exp,
		);
	}
	for (const delimiter of [',', ' ', ', ']) {
		const exp = `hsl(${hslStr.join(delimiter)})`;
		assert.deepStrictEqual(
			parseCallExpression(exp),
			{
				color: expected,
				alpha: 1,
				colorType: 'hsl',
				legacy: delimiter !== ' ',
				spaced: delimiter !== ',',
			} satisfies ColorData,
			exp,
		);
	}
	for (const alpha of ['0.555', '.555', '55.5%']) {
		for (const delimiter of [',', ', ']) {
			const exp = `hsl(${hslStr.join(delimiter)},${alpha})`;
			assert.deepStrictEqual(
				parseCallExpression(exp),
				{
					color: expected,
					alpha: 0.555,
					colorType: 'hsl',
					legacy: true,
					spaced: delimiter === ', ',
				} satisfies ColorData,
				exp,
			);
		}
		const exp = `hsl(${hslStr.join(' ')} / ${alpha})`;
		assert.deepStrictEqual(
			parseCallExpression(exp),
			{
				color: expected,
				alpha: 0.555,
				colorType: 'hsl',
				legacy: false,
				spaced: true,
			} satisfies ColorData,
			exp,
		);
	}
	const units = [['', 1], ['deg', 1], ['rad', 180 / Math.PI], ['grad', 0.9], ['turn', 360]] as const;
	for (const [unit, factor] of units) {
		const exp = `hsl( ${(h / factor).toFixed(4)}${unit} ${s} ${l} )`;
		assert.deepStrictEqual(
			parseCallExpression(exp),
			{
				color: expected,
				alpha: 1,
				colorType: 'hsl',
				legacy: false,
				spaced: true,
			} satisfies ColorData,
			exp,
		);
	}
};

describe('discovering CSS colors', () => {
	it('parses call expressions', () => {
		assert.strictEqual(parseCallExpression('hwb(0 100% 0)'), false);
		assert.strictEqual(parseCallExpression('rgb(255 0)'), false);
		assert.deepStrictEqual(
			parseCallExpression('rgb(255 0 0.3)'),
			{
				color: [255, 0, 0],
				alpha: 1,
				colorType: 'rgb',
				legacy: false,
				spaced: true,
			},
		);
		assert.deepStrictEqual(
			parseCallExpression('rgb(255, 0, 0, 55.5%)'),
			{
				color: [255, 0, 0],
				alpha: 0.555,
				colorType: 'rgb',
				legacy: true,
				spaced: true,
			},
		);
		rgbTest([255, 0, 0]);
		rgbTest([100.6, 100.4, 100], [101, 100, 100]);
		rgbTest([0.3, 0.4, 0.5], [77, 102, 127]);
		rgbTest([0.333, 0.444, 0.555], [85, 113, 142]);
		hslTest([0, 100, 50], [255, 0, 0]);
		hslTest([0, 99.9, 50.1], [255, 1, 1]);
		hslTest([33, 55, 77], [229, 200, 164]);
	});

	it('parses color literals', () => {
		assert.strictEqual(parseColorLiteral('#f0'), false);
		assert.strictEqual(parseColorLiteral('#ff000'), false);
		assert.strictEqual(parseColorLiteral('#ff00000'), false);
		assert.strictEqual(parseColorLiteral('#ff0000000'), false);
		const expected: Omit<ColorData, 'legacy'> = {
			color: [255, 0, 0],
			alpha: 1,
			colorType: 'hex',
			spaced: false,
		};
		assert.deepStrictEqual(
			parseColorLiteral('#f00'),
			{...expected, legacy: true},
		);
		assert.deepStrictEqual(
			parseColorLiteral('#f00f'),
			{...expected, legacy: false},
		);
		assert.deepStrictEqual(
			parseColorLiteral('#f008'),
			{...expected, legacy: false, alpha: 0.53},
		);
		assert.deepStrictEqual(
			parseColorLiteral('#ff0000'),
			{...expected, legacy: true},
		);
		assert.deepStrictEqual(
			parseColorLiteral('#ff0000ff'),
			{...expected, legacy: false},
		);
		assert.deepStrictEqual(
			parseColorLiteral('#ff000088'),
			{...expected, legacy: false, alpha: 0.53},
		);
	});

	it('parses named colors', () => {
		const expected: ColorData = {
			color: [255, 0, 0],
			alpha: 1,
			colorType: 'named',
			legacy: true,
			spaced: false,
		};
		assert.strictEqual(parseNamedColor('ANY', namedColors), false);
		assert.strictEqual(parseNamedColor('__proto__', namedColors), false);
		assert.deepStrictEqual(parseNamedColor('red', namedColors), expected);
		assert.deepStrictEqual(parseNamedColor('RED', namedColors), expected);
	});

	it('discovers colors in CSS code', () => {
		const cssCode = `a {
				width: auto;
				top: var(--top);
				color: red;
				background-color: rgb(255 0 0 / 0.5);
				border-color: #f008;
				outline-color: hsl(33,55%,77%);
				background-image: linear-gradient(0deg, blue, #0f0 40%, hsla(0deg 100 50));
			}`,
			cssTree = cssLanguage.parser.parse(cssCode),
			cssDoc = Text.of(cssCode.split('\n')),
			htmlCode = `<style>${cssCode}</style>`,
			htmlTree = htmlLanguage.parser.parse(htmlCode),
			htmlDoc = Text.of(htmlCode.split('\n'));
		const mockTest = (pos: number, type: string, str: string, expected: ColorData | false = false): void => {
			const settings = [
				[0, cssTree, cssDoc],
				[7, htmlTree, htmlDoc],
			] as const;
			for (const [offset, tree, doc] of settings) {
				let node = tree.resolveInner(pos + offset);
				if (node.name === 'Callee') {
					node = node.parent!;
				}
				const {from, to, name} = node;
				assert.strictEqual(name, type);
				assert.strictEqual(doc.sliceString(from, to), str);
				assert.deepStrictEqual(
					discoverColorsInCSS(tree, node, doc),
					{from, to},
				);
				assert.deepStrictEqual(
					parseCallExpression(str) || parseColorLiteral(str) || parseNamedColor(str, namedColors),
					expected,
				);
			}
		};
		mockTest(16, 'ValueName', 'auto');
		mockTest(31, 'CallExpression', 'var(--top)');
		mockTest(
			54,
			'ValueName',
			'red',
			{
				colorType: 'named',
				color: [255, 0, 0],
				alpha: 1,
				legacy: true,
				spaced: false,
			},
		);
		mockTest(
			81,
			'CallExpression',
			'rgb(255 0 0 / 0.5)',
			{
				colorType: 'rgb',
				color: [255, 0, 0],
				alpha: 0.5,
				legacy: false,
				spaced: true,
			},
		);
		mockTest(
			119,
			'ColorLiteral',
			'#f008',
			{
				colorType: 'hex',
				color: [255, 0, 0],
				alpha: 0.53,
				legacy: false,
				spaced: false,
			},
		);
		mockTest(
			145,
			'CallExpression',
			'hsl(33,55%,77%)',
			{
				colorType: 'hsl',
				color: [229, 200, 164],
				alpha: 1,
				legacy: true,
				spaced: false,
			},
		);
		mockTest(184, 'CallExpression', 'linear-gradient(0deg, blue, #0f0 40%, hsla(0deg 100 50))');
		mockTest(
			206,
			'ValueName',
			'blue',
			{
				colorType: 'named',
				color: [0, 0, 255],
				alpha: 1,
				legacy: true,
				spaced: false,
			},
		);
		mockTest(
			213,
			'ColorLiteral',
			'#0f0',
			{
				colorType: 'hex',
				color: [0, 255, 0],
				alpha: 1,
				legacy: true,
				spaced: false,
			},
		);
		mockTest(
			222,
			'CallExpression',
			'hsla(0deg 100 50)',
			{
				colorType: 'hsla',
				color: [255, 0, 0],
				alpha: 1,
				legacy: false,
				spaced: true,
			},
		);
	});

	it('discovers colors in HTML style attributes', () => {
		const code = `<p id="aa" style=width:auto;color:red><div class=bb style="
				top: var(--top);
				background-color: rgb(255 0 0 / 0.5);
				border-color: #f008;
				outline-color: hsl(33,55%,77%);
				background-image: linear-gradient(0deg, blue, #0f0 40%, hsla(0deg 100 50));
			">`,
			tree = htmlLanguage.parser.parse(code),
			doc = Text.of(code.split('\n'));
		const mockTest = (pos: number, type: string, str: string, expected: string[] | false = false): void => {
			const node = tree.resolve(pos),
				{from, to, name} = node;
			assert.strictEqual(name, type);
			assert.strictEqual(code.slice(from, to), str);
			const result = discoverColorsInCSS(tree, node, doc) as WidgetOptions[] | false | undefined;
			assert.deepStrictEqual(
				result && result.map(({from: f, to: t}) => code.slice(f, t)),
				expected,
			);
		};
		mockTest(8, 'AttributeValue', '"aa"');
		mockTest(50, 'UnquotedAttributeValue', 'bb');
		mockTest(
			18,
			'UnquotedAttributeValue',
			'width:auto;color:red',
			[
				'auto',
				'red',
			],
		);
		mockTest(
			59,
			'AttributeValue',
			`"
				top: var(--top);
				background-color: rgb(255 0 0 / 0.5);
				border-color: #f008;
				outline-color: hsl(33,55%,77%);
				background-image: linear-gradient(0deg, blue, #0f0 40%, hsla(0deg 100 50));
			"`,
			[
				'var(--top)',
				'rgb(255 0 0 / 0.5)',
				'#f008',
				'hsl(33,55%,77%)',
				'linear-gradient(0deg, blue, #0f0 40%, hsla(0deg 100 50))',
				'blue',
				'#0f0',
				'hsla(0deg 100 50)',
			],
		);
	});

	it('does not discover colors in other contexts', () => {
		const code = '<table bgcolor="#f00">',
			tree = htmlLanguage.parser.parse(code),
			doc = Text.of([code]),
			node = tree.resolveInner(16);
		assert.strictEqual(node.name, 'AttributeValue');
		assert.strictEqual(code.slice(node.from, node.to), '"#f00"');
		assert.strictEqual(discoverColorsInCSS(tree, node, doc), false);
	});
});
