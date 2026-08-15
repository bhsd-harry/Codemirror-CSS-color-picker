import {numToHex} from '@bhsd/common';
import {rgba} from '@bhsd/browser/color';
import type {WidgetOptions, RGB, ColorData} from './types';

const parse = (color: string): Pick<ColorData, 'color' | 'alpha'> | false => {
	const result = rgba(color);
	return result.length === 4 && {
		color: result.slice(0, 3) as RGB,
		alpha: result[3],
	};
};

/**
 * Parses a CSS color function call expression (such as `rgb()`)
 * @param callExp the full text of the call expression, including function name and parentheses
 */
export const parseCallExpression = (callExp: string): ColorData | false => {
	const color = parse(callExp);
	return color && {
		...color,
		colorType: callExp.split('(', 1)[0]!.toLowerCase() as 'rgba' | 'rgb',
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

export const alphaToString = (alpha: number, legacy: boolean, spaced: boolean): string =>
	(legacy ? `,${spaced ? ' ' : ''}` : ' / ')
	+ String(alpha === 0 ? alpha : Number(alpha.toFixed(2)));

export const colorToString = (
	{color, alpha, colorType, legacy, spaced}: WidgetOptions,
	value: string,
): string | false => {
	const currentColor = [1, 3, 5].map(i => parseInt(value.slice(i, i + 2), 16)) as RGB;
	if (currentColor.every((c, i) => c === Math.round(color[i]!))) {
		return false;
	}
	const delimiter = getDelimiter(legacy, spaced),
		noAlpha = alpha === 1,
		rgbParams = `(${currentColor.join(delimiter)}${noAlpha ? '' : alphaToString(alpha, legacy, spaced)})`;
	switch (colorType) {
		case 'rgba':
		case 'rgb':
			return colorType + rgbParams;
		case 'hex':
			if (!noAlpha) {
				return value + numToHex(alpha);
			}
			// fall through
		default:
			return noAlpha ? value : `rgba${rgbParams}`;
	}
};
