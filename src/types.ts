import type {Text} from '@codemirror/state';
import type {Tree, SyntaxNodeRef} from '@lezer/common';

export type RGB = [number, number, number];

export interface ColorData {

	/** RGB component values, each in the range 0-255 */
	color: RGB;
	alpha: number;
	colorType: 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'hex' | 'named' | 'unknown';
	legacy: boolean;
	spaced: boolean;

}

export interface WidgetOptions extends ColorData {
	from: number;
	to: number;
}

export type ColorDiscovery = Pick<WidgetOptions, 'from' | 'to'> | WidgetOptions & {colorType: 'unknown'};

/**
 * Discovers colors in the syntax node, returning the options for the color picker widgets if colors are found,
 * or `false` if the children of the syntax node can be skipped.
 * @param tree Lezer syntax tree
 * @param node the syntax node to check for colors
 * @param doc the editor document
 */
export type DiscoverColors = (tree: Tree, node: SyntaxNodeRef, doc: Text) =>
	ColorDiscovery | ColorDiscovery[] | false | undefined;
