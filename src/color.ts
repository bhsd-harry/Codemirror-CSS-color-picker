import {numToHex, rgba} from '@bhsd/common';
import type {Colord} from 'colord';
import type {WidgetOptions, RGB, ColorData} from './types';

const rgbCallExpRegex =
	/^rgba?\(\s*[+-]?(?:\d*\.)?\d+%?(?:\s|\s*,)\s*[+-]?(?:\d*\.)?\d+%?(?:\s|\s*,)\s*[+-]?(?:\d*\.)?\d+%?\s*(?:[,/]\s*[+-]?(?:\d*\.)?\d+%?\s*)?\)$/iu;
const hslCallExpRegex =
	/^hsla?\(\s*[+-]?(?:\d*\.)?\d+(?:deg|g?rad|turn)?(?:\s|\s*,)\s*[+-]?(?:\d*\.)?\d+%?(?:\s|\s*,)\s*[+-]?(?:\d*\.)?\d+%?\s*(?:[,/]\s*[+-]?(?:\d*\.)?\d+%?\s*)?\)$/iu;
const hexRegex = /^#(?:[\da-f]{3,4}|(?:[\da-f]{2}){3,4})$/iu;

const convertColor = (color: Colord): Pick<ColorData, 'color' | 'alpha'> => {
	const {r, g, b, a} = color.toRgb();
	return {
		color: [r, g, b].map(Math.round) as RGB,
		alpha: a,
	};
};

/**
 * Parses a CSS color function call expression (including `rgb()`, `rgba()`, `hsl()`, `hsla()`)
 * @param callExp the full text of the call expression, including function name and parentheses
 */
export const parseCallExpression = (callExp: string): ColorData | false => {
	const fn = callExp.split('(', 1)[0]!.toLowerCase();
	switch (fn) {
		case 'rgba':
		case 'rgb':
			if (!rgbCallExpRegex.test(callExp)) {
				return false;
			}
			break;
		case 'hsla':
		case 'hsl':
			if (!hslCallExpRegex.test(callExp)) {
				return false;
			}
			break;
		default:
			return false;
	}
	const color = rgba(callExp);
	return color && {
		...convertColor(color),
		colorType: fn,
		legacy: callExp.includes(','),
		spaced: /\s/u.test(callExp),
	};
};

/**
 * Parses a hex color literal (e.g. `#ff0000`, `#f00`, `#ff000080`, `#f008`)
 * @param colorLiteral the hex color literal text
 */
export const parseColorLiteral = (colorLiteral: string): ColorData | false => {
	if (!hexRegex.test(colorLiteral)) {
		return false;
	}
	const color = rgba(colorLiteral),
		{length} = colorLiteral;
	return color && {
		...convertColor(color),
		colorType: 'hex',
		legacy: length === 4 || length === 7,
		spaced: false,
	};
};

/**
 * Parses a named color (e.g. `red`, `blue`, `rebeccapurple`)
 * @param colorName the named color text
 * @param colors an object mapping color names to RGB values
 */
export const parseNamedColor = (colorName: string, colors?: Map<string, string>): ColorData | false => {
	const color = rgba(colorName, colors);
	return color && {
		...convertColor(color),
		colorType: 'named',
		legacy: true,
		spaced: false,
	};
};

export const getDelimiter = (legacy: boolean, spaced: boolean): string => legacy ? `,${spaced ? ' ' : ''}` : ' ';

export const alphaToString = (alpha: number, legacy: boolean, spaced: boolean): string => alpha === 1
	? ''
	: (legacy ? `,${spaced ? ' ' : ''}` : ' / ')
		+ String(alpha === 0 ? alpha : Number(alpha.toFixed(2)));

export const colorToString = (
	{color, alpha, colorType, legacy, spaced}: WidgetOptions,
	value: string,
	colors?: Map<string, string>,
): string | false => {
	const result = rgba(value) as Colord,
		{r, g, b} = result.toRgb();
	if (r === Math.round(color[0]) && g === Math.round(color[1]) && b === Math.round(color[2])) {
		return false;
	}
	const delimiter = getDelimiter(legacy, spaced);
	switch (colorType) {
		case 'rgba':
		case 'rgb':
			return `${colorType}(${[r, g, b].join(delimiter)}${alphaToString(alpha, legacy, spaced)})`;
		case 'hsla':
		case 'hsl': {
			const {h, s, l} = result.toHsl();
			return `${colorType}(${
				[Math.round(h), `${Math.round(s)}%`, `${Math.round(l)}%`].join(delimiter)
			}${alphaToString(alpha, legacy, spaced)})`;
		}
		case 'named':
			if (colors && alpha === 1) {
				// If the color is an exact match for another named color, prefer retaining name
				const colorName = [...colors].find(([, colorValue]) => colorValue === value)?.[0];
				if (colorName) {
					return colorName;
				}
			}
			// fall through
		case 'hex':
			// hex color literal
			return value + (alpha === 1 ? '' : numToHex(alpha));
		default:
			throw new Error('Unknown color type');
	}
};
