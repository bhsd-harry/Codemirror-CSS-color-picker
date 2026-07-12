import {intToHex, numToHex} from '@bhsd/common';
import {rgba, hsla, colorsNamed} from '@bhsd/common/color';
import type {WidgetOptions, RGB, ColorData} from './types';

const parse = (color: string): Pick<ColorData, 'color' | 'alpha'> | false => {
	const [r, g, b, alpha] = rgba(color);
	return alpha !== undefined && {
		color: [r!, g!, b!] as RGB,
		alpha,
	};
};

/**
 * Parses a CSS color function call expression (including `rgb()`, `rgba()`, `hsl()`, `hsla()`)
 * @param callExp the full text of the call expression, including function name and parentheses
 */
export const parseCallExpression = (callExp: string): ColorData | false => {
	const color = parse(callExp);
	return color && {
		...color,
		colorType: callExp.split('(', 1)[0]!.toLowerCase() as 'rgba' | 'rgb' | 'hsla' | 'hsl',
		legacy: callExp.includes(','),
		spaced: /\s/u.test(callExp),
	};
};

/**
 * Parses a hex color literal (e.g. `#ff0000`, `#f00`, `#ff000080`, `#f008`)
 * @param colorLiteral the hex color literal text
 */
export const parseColorLiteral = (colorLiteral: string): ColorData | false => {
	const color = parse(colorLiteral),
		{length} = colorLiteral;
	return color && {
		...color,
		colorType: 'hex',
		legacy: length === 4 || length === 7,
		spaced: false,
	};
};

/**
 * Parses a named color (e.g. `red`, `blue`, `rebeccapurple`)
 * @param colorName the named color text
 */
export const parseNamedColor = (colorName: string): ColorData | false => {
	const color = parse(colorName);
	return color && {
		...color,
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

const hexToName = new Map<string, string>(
	Object.entries(colorsNamed).map(([key, val]) => [`#${intToHex(val, 6)}`, key]),
);

export const colorToString = (
	{color, alpha, colorType, legacy, spaced}: WidgetOptions,
	value: string,
): string | false => {
	const currentColor = rgba(value).slice(0, 3) as RGB;
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
			const [h, s, l] = hsla(value);
			return `${colorType}(${[h, `${s}%`, `${l}%`].join(delimiter)}${alphaToString(alpha, legacy, spaced)})`;
		}
		case 'named':
			if (alpha === 1) {
				// If the color is an exact match for another named color, prefer retaining name
				const colorName = hexToName.get(value);
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
