import {NodeProp} from '@lezer/common';
import type {SyntaxNodeRef} from '@lezer/common';
import type {ColorDiscovery, DiscoverColors} from './types';

/**
 * Discovers colors in CSS code
 * @implements
 */
export const discoverColorsInCSS: DiscoverColors = (tree, {from, to, name: typeName}, doc) => {
	switch (typeName) {
		case 'UnquotedAttributeValue':
		case 'AttributeValue': {
			// CSS nested in an HTML attribute value
			const overlayTree = tree.resolveInner(from, 0).tree?.prop(NodeProp.mounted)?.tree;
			if (overlayTree?.type.name !== 'Styles') {
				// Skip if the attribute value is not a style attribute, or if there is no mounted tree
				return false;
			}
			const ret: ColorDiscovery[] = [],
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
		case 'ColorLiteral':
		case 'ValueName':
			return {from, to};
		default:
			return undefined;
	}
};
