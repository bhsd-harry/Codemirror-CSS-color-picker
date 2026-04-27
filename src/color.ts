import rgb from 'color-space/rgb.js';
import 'color-space/hsl.js';
import colorRgba from 'color-rgba';
import {numToHex} from '@bhsd/common';
import type {WidgetOptions, RGB} from './css';

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
		default:
			// hex color literal
			return value + (alpha === 1 ? '' : numToHex(alpha));
	}
};
