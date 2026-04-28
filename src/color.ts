import rgb from 'color-space/rgb.js';
import 'color-space/hsl.js';
import colorRgba from 'color-rgba';
import namedColors from 'color-name';
import {numToHex} from '@bhsd/common';
import type {WidgetOptions, RGB, ColorData} from './types';

const rgbCallExpRegex =
	/^rgba?\(\s*(?:\d*\.)?\d+%?(?:\s|\s*,)\s*(?:\d*\.)?\d+%?(?:\s|\s*,)\s*(?:\d*\.)?\d+%?\s*(?:[,/]\s*(?:\d*\.)?\d+%?\s*)?\)$/iu;
const hslCallExpRegex =
	/^hsla?\(\s*(?:\d*\.)?\d+(?:deg|g?rad|turn)?(?:\s|\s*,)\s*(?:\d*\.)?\d+%?(?:\s|\s*,)\s*(?:\d*\.)?\d+%?\s*(?:[,/]\s*(?:\d*\.)?\d+%?\s*)?\)$/iu;
const hexRegex = /^#(?:[\da-f]{3,4}|(?:[\da-f]{2}){3,4})$/iu;

/**
 * Parses a CSS color function call expression (including `rgb()`, `rgba()`, `hsl()`, `hsla()`)
 * @param callExp the full text of the call expression, including function name and parentheses
 */
export const parseCallExpression = (callExp: string): ColorData | false | undefined => {
	const fn = callExp.split('(', 1)[0]!.toLowerCase();
	switch (fn) {
		case 'rgba':
		case 'rgb':
			if (!rgbCallExpRegex.test(callExp)) {
				return undefined;
			}
			break;
		case 'hsla':
		case 'hsl':
			if (!hslCallExpRegex.test(callExp)) {
				return undefined;
			}
			break;
		default:
			return undefined;
	}
	const [r, g, b, alpha] = colorRgba(callExp);
	return alpha !== undefined && {
		colorType: fn,
		color: [r!, g!, b!].map(Math.round) as RGB,
		alpha,
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
	const [r, g, b, alpha] = colorRgba(colorLiteral),
		{length} = colorLiteral;
	return alpha !== undefined && {
		colorType: 'hex',
		color: [r!, g!, b!],
		alpha,
		legacy: length === 4 || length === 7,
		spaced: false,
	};
};

/**
 * Parses a named color (e.g. `red`, `blue`, `rebeccapurple`)
 * @param colorName the named color text
 */
export const parseNamedColor = (colorName: string): ColorData | false => {
	const lcName = colorName.toLowerCase();
	if (!Object.prototype.hasOwnProperty.call(namedColors, lcName)) {
		return false;
	}
	const color = namedColors[lcName as keyof typeof namedColors];
	return {
		colorType: 'named',
		color,
		alpha: 1,
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
	colors?: Record<string, RGB>,
): string | false => {
	const currentColor = colorRgba(value).slice(0, 3) as RGB;
	if (currentColor.every((c, i) => c === Math.round(color[i]!))) {
		return false;
	}
	const delimiter = getDelimiter(legacy, spaced);
	switch (colorType) {
		case 'rgba':
		case 'rgb':
			return `${colorType}(${currentColor.join(delimiter)}${alphaToString(alpha, legacy, spaced)})`;
		case 'hsla':
		case 'hsl': {
			const [h, s, l] = rgb.hsl(currentColor.slice(0, 3) as RGB);
			return `${colorType}(${
				[Math.round(h), `${Math.round(s)}%`, `${Math.round(l)}%`].join(delimiter)
			}${alphaToString(alpha, legacy, spaced)})`;
		}
		case 'named':
			if (colors && alpha === 1) {
				// If the color is an exact match for another named color, prefer retaining name
				const colorName = Object.entries(colors)
					.find(([, colorValues]) => colorValues.every((c, i) => c === currentColor[i]!))
					?.[0];
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
