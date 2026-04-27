# CodeMirror Color Picker

<span><a href="https://www.npmjs.com/package/@bhsd/codemirror-css-color-picker" title="NPM version badge"><img src="https://img.shields.io/npm/v/@bhsd/codemirror-css-color-picker?color=blue" alt="NPM version badge" /></a></span>

A CodeMirror extension that adds a color picker input next to CSS color values. This is a fork of [@replit/codemirror-css-color-picker](https://www.npmjs.com/package/@replit/codemirror-css-color-picker).

## Usage

```ts
import {basicSetup} from 'codemirror';
import {EditorState} from '@codemirror/state';
import {EditorView} from '@codemirror/view';
import {css} from '@codemirror/lang-css';
import {colorPicker} from '@bhsd/codemirror-css-color-picker';

new EditorView({
	parent: document.querySelector('#editor'),
	state: EditorState.create({
		doc: '.wow {\n\tcolor: #fff;\n}',
		extensions: [
			basicSetup,
			css(),
			colorPicker,
		],
	}),
});
```

## Todos

- Investigate solutions for alpha values. `input[type="color"]` does not support alpha values. We could show another number input next to it for the alpha value.
