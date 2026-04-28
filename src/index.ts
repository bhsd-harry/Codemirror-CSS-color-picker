import {EditorView, WidgetType, ViewPlugin, Decoration} from '@codemirror/view';
import {syntaxTree} from '@codemirror/language';
import namedColors from 'color-name';
import {intToHex} from '@bhsd/common';
import {discoverColorsInCSS} from './css.js';
import {colorToString, parseCallExpression, parseColorLiteral, parseNamedColor} from './color.js';
import type {ViewUpdate, DecorationSet, PluginValue} from '@codemirror/view';
import type {Range, Extension} from '@codemirror/state';
import type {DiscoverColors, WidgetOptions, RGB, ColorData} from './types';

export {namedColors};
export type {DiscoverColors, WidgetOptions};

export const wrapperClassName = 'cm-css-color-picker-wrapper';

const pickerState = new WeakMap<HTMLInputElement, WidgetOptions>();

class ColorPickerWidget extends WidgetType {
	declare private readonly state;
	declare private readonly readonly;

	/** @class */
	constructor(state: WidgetOptions, readOnly: boolean) {
		super();
		this.state = state;
		this.readonly = readOnly;
	}

	/** @override */
	override eq(other: this): boolean {
		return other.readonly === this.readonly
			&& other.state.from === this.state.from
			&& other.state.to === this.state.to
			&& other.state.colorType === this.state.colorType
			&& other.state.color === this.state.color
			&& other.state.alpha === this.state.alpha
			&& other.state.legacy === this.state.legacy
			&& other.state.spaced === this.state.spaced;
	}

	/** @override */
	override toDOM(): HTMLSpanElement {
		const picker = document.createElement('input');
		picker.type = 'color';
		picker.value = `#${this.state.color.map(c => intToHex(c)).join('')}`;
		if (this.readonly || this.state.colorType === 'unknown') {
			picker.disabled = true;
		}
		pickerState.set(picker, this.state);
		const wrapper = document.createElement('span');
		wrapper.className = wrapperClassName;
		wrapper.append(picker);
		return wrapper;
	}

	/** @override */
	override ignoreEvent(e: Event): boolean {
		return e.type !== 'change';
	}
}

/**
 * Compute color picker decorations
 * @param view the editor view for which to compute decorations
 * @param discoverColors the function to discover colors in a syntax node; return `false` to skip children
 */
const colorPickersDecorations = (view: EditorView, discoverColors: DiscoverColors): DecorationSet => {
	const widgets: Range<Decoration>[] = [],
		{state, visibleRanges} = view,
		tree = syntaxTree(state);
	for (const {from, to} of visibleRanges) {
		tree.iterate({
			from,
			to,
			enter(node) {
				const widgetOptions = discoverColors(tree, node, state.doc);
				if (!widgetOptions) {
					return widgetOptions;
				}
				for (const wo of Array.isArray(widgetOptions) ? widgetOptions : [widgetOptions]) {
					if ((wo as Partial<WidgetOptions>).colorType !== 'unknown') {
						const value = state.sliceDoc(wo.from, wo.to);
						let data: ColorData | false | undefined;
						if (value.includes('(')) {
							data = parseCallExpression(value);
						} else if (value.startsWith('#')) {
							data = parseColorLiteral(value);
						} else {
							data = parseNamedColor(value);
						}
						if (!data) {
							continue;
						}
						Object.assign(wo, data);
					}
					widgets.push(
						Decoration.widget({
							widget: new ColorPickerWidget(wo as WidgetOptions, state.readOnly),
							side: 1,
						}).range(wo.from),
					);
				}
				return undefined;
			},
		});
	}
	return Decoration.set(widgets);
};

const colorPickerTheme = EditorView.baseTheme({
	[`.${wrapperClassName}`]: {
		display: 'inline-block',
		marginLeft: '0.6ch',
		marginRight: '0.6ch',
		height: '1em',
		width: '1em',
		transform: 'translateY(1px)',

		'& input[type="color"]': {
			height: '100%',
			width: '100%',
			padding: 0,
			border: 'none',
			outline: '1px solid #eee',
			'&:enabled': {
				cursor: 'pointer',
			},
			'&::-webkit-color-swatch-wrapper': {
				padding: 0,
			},
			'&::-webkit-color-swatch': {
				border: 'none',
			},
			'&::-moz-color-swatch': {
				border: 'none',
			},
		},
	},
});

/**
 * Factory function to create a color picker plugin with the given options
 * @param discoverColors the function to discover colors in a syntax node; return `false` to skip children
 * @param colors an optional object of color names mapping to RGB values
 */
export const makeColorPicker = (discoverColors: DiscoverColors, colors?: Record<string, RGB>): Extension => [
	ViewPlugin.fromClass(
		class ColorPickerViewPlugin implements PluginValue {
			declare readOnly;
			declare decorations;

			/** @class */
			constructor(view: EditorView) {
				this.readOnly = view.state.readOnly;
				this.decorations = colorPickersDecorations(view, discoverColors);
			}

			/** @implements */
			update({docChanged, viewportChanged, view}: ViewUpdate): void {
				const {readOnly} = view.state;
				if (docChanged || viewportChanged || readOnly !== this.readOnly) {
					this.readOnly = readOnly;
					this.decorations = colorPickersDecorations(view, discoverColors);
				}
			}
		},
		{
			decorations(v) {
				return v.decorations;
			},
			eventHandlers: {
				change(e, view) {
					const target = e.target as HTMLInputElement;
					if (
						target.nodeName !== 'INPUT'
						|| target.type !== 'color'
						|| !target.parentElement?.classList.contains(wrapperClassName)
					) {
						return false;
					}
					const state = pickerState.get(target)!,
						insert = colorToString(state, target.value, colors);
					if (insert) {
						const {from, to} = state;
						view.dispatch({
							changes: {from, to, insert},
						});
					}
					return true;
				},
			},
		},
	),
	colorPickerTheme,
];

/** Default color picker plugin for CSS and HTML */
export const colorPicker = /* @__PURE__ */ makeColorPicker(discoverColorsInCSS, namedColors);
