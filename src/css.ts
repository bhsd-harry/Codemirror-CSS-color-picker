import {NodeProp} from '@lezer/common';
import colorRgba from 'color-rgba';
import namedColors from 'color-name';
import type {Text} from '@codemirror/state';
import type {Tree, SyntaxNodeRef} from '@lezer/common';

export type RGB = [number, number, number];

export interface WidgetOptions {
	from: number;
	to: number;

	/** RGB component values, each in the range 0-255 */
	color: RGB;
	alpha: number;
	colorType: 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'hex' | 'named';
	legacy: boolean;
	spaced: boolean;
}

/**
 * Discovers colors in the syntax node, returning the options for the color picker widgets if colors are found,
 * or `false` if the children of the syntax node can be skipped.
 * @param tree Lezer syntax tree
 * @param node the syntax node to check for colors
 * @param doc the editor document
 */
export type DiscoverColors = (tree: Tree, node: SyntaxNodeRef, doc: Text) =>
	WidgetOptions | WidgetOptions[] | false | undefined;

export type ColorData = Omit<WidgetOptions, 'from' | 'to'>;

const rgbCallExpRegex =
	/^rgba?\(\s*\d+%?(?:\s|\s*,)\s*\d+%?(?:\s|\s*,)\s*\d+%?\s*(?:[,/]\s*0?\.?\d+%?\s*)?\)$/iu;
const hslCallExpRegex =
	/^hsla?\(\s*\d+(?:deg|g?rad|turn)?(?:\s|\s*,)\s*\d+%?(?:\s|\s*,)\s*\d+%?\s*(?:[,/]\s*0?\.?\d+%?\s*)?\)$/iu;
const hexRegex = /^#(?:[\da-f]{3,4}|(?:[\da-f]{2}){3,4})$/iu;

/**
 * Discovers colors in CSS code
 * @implements
 */
export const discoverColorsInCSS: DiscoverColors = (tree, {from, to, name: typeName}, doc) => {
	let parse: (callExp: string) => ColorData | false | undefined;
	switch (typeName) {
		case 'UnquotedAttributeValue':
		case 'AttributeValue': {
			// CSS nested in an HTML attribute value
			const overlayTree = tree.resolveInner(from, 0).tree?.prop(NodeProp.mounted)?.tree;
			if (overlayTree?.type.name !== 'Styles') {
				// Skip if the attribute value is not a style attribute, or if there is no mounted tree
				return false;
			}
			const ret: WidgetOptions[] = [],
				// Account for the quotation mark in AttributeValue
				offset = from + (typeName === 'AttributeValue' ? 1 : 0);
			overlayTree.iterate({
				from: 0,
				to: overlayTree.length,
				enter({name, from: overlayFrom, to: overlayTo}) {
					const widgetOptions = discoverColorsInCSS(
						tree,
						{
							from: offset + overlayFrom,
							to: offset + overlayTo,
							name,
						} as SyntaxNodeRef,
						doc,
					);
					if (widgetOptions) {
						if (Array.isArray(widgetOptions)) {
							throw new Error('Unexpected nested overlays');
						}
						ret.push(widgetOptions);
					}
				},
			});
			return ret;
		}
		case 'CallExpression':
			parse = parseCallExpression;
			break;
		case 'ColorLiteral':
			parse = parseColorLiteral;
			break;
		case 'ValueName':
			parse = parseNamedColor;
			break;
		default:
			return undefined;
	}
	const result = parse(doc.sliceString(from, to));
	return result && {...result, from, to};
};

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
