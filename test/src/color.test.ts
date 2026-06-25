import assert from 'assert';
import {describe, it} from '@bhsd/test-util/mocha';
import {getDelimiter, alphaToString, colorToString} from '../../dist/color.js';
import type {WidgetOptions} from '../../dist/types';

const mockTest = (alpha: number, expected: [string, string, string]): void => {
	assert.strictEqual(alphaToString(alpha, false, true), expected[0]);
	assert.strictEqual(alphaToString(alpha, true, true), expected[1]);
	assert.strictEqual(alphaToString(alpha, true, false), expected[2]);
};

const colorTest = (
	colorType: WidgetOptions['colorType'],
	expected: [string, string, string, string, string, string],
): void => {
	const options = {colorType, color: [0, 0, 0]} as WidgetOptions,
		value = '#ff0000';
	assert.strictEqual(
		colorToString({...options, alpha: 1, legacy: false}, value),
		expected[0],
	);
	assert.strictEqual(
		colorToString({...options, alpha: 1, legacy: true, spaced: true}, value),
		expected[1],
	);
	assert.strictEqual(
		colorToString({...options, alpha: 1, legacy: true, spaced: false}, value),
		expected[2],
	);
	assert.strictEqual(
		colorToString({...options, alpha: 0.555, legacy: false}, value),
		expected[3],
	);
	assert.strictEqual(
		colorToString({...options, alpha: 0.555, legacy: true, spaced: true}, value),
		expected[4],
	);
	assert.strictEqual(
		colorToString({...options, alpha: 0.555, legacy: true, spaced: false}, value),
		expected[5],
	);
};

describe('color utils', () => {
	it('getDelimiter', () => {
		assert.strictEqual(getDelimiter(false, true), ' ');
		assert.strictEqual(getDelimiter(true, true), ', ');
		assert.strictEqual(getDelimiter(true, false), ',');
	});

	it('alphaToString', () => {
		mockTest(1, ['', '', '']);
		mockTest(0, [' / 0', ', 0', ',0']);
		mockTest(0.555, [' / 0.56', ', 0.56', ',0.56']);
		mockTest(0.5, [' / 0.5', ', 0.5', ',0.5']);
	});

	it('colorToString', () => {
		assert.strictEqual(colorToString({color: [254.6, 0.3, 0]} as WidgetOptions, '#f00'), false);
		colorTest(
			'rgba',
			[
				'rgba(255 0 0)',
				'rgba(255, 0, 0)',
				'rgba(255,0,0)',
				'rgba(255 0 0 / 0.56)',
				'rgba(255, 0, 0, 0.56)',
				'rgba(255,0,0,0.56)',
			],
		);
		colorTest(
			'rgb',
			[
				'rgb(255 0 0)',
				'rgb(255, 0, 0)',
				'rgb(255,0,0)',
				'rgb(255 0 0 / 0.56)',
				'rgb(255, 0, 0, 0.56)',
				'rgb(255,0,0,0.56)',
			],
		);
		colorTest(
			'hsla',
			[
				'hsla(0 100% 50%)',
				'hsla(0, 100%, 50%)',
				'hsla(0,100%,50%)',
				'hsla(0 100% 50% / 0.56)',
				'hsla(0, 100%, 50%, 0.56)',
				'hsla(0,100%,50%,0.56)',
			],
		);
		colorTest(
			'hsl',
			[
				'hsl(0 100% 50%)',
				'hsl(0, 100%, 50%)',
				'hsl(0,100%,50%)',
				'hsl(0 100% 50% / 0.56)',
				'hsl(0, 100%, 50%, 0.56)',
				'hsl(0,100%,50%,0.56)',
			],
		);
		colorTest(
			'named',
			[
				'red',
				'red',
				'red',
				'#ff00008e',
				'#ff00008e',
				'#ff00008e',
			],
		);
		colorTest(
			'hex',
			[
				'#ff0000',
				'#ff0000',
				'#ff0000',
				'#ff00008e',
				'#ff00008e',
				'#ff00008e',
			],
		);
	});
});
