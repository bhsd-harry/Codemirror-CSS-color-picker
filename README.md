# CodeMirror Color Picker

[![npm version](https://badge.fury.io/js/@bhsd%2Fcodemirror-css-color-picker.svg)](https://www.npmjs.com/package/@bhsd/codemirror-css-color-picker)
[![CodeQL](https://github.com/bhsd-harry/Codemirror-CSS-color-picker/actions/workflows/codeql.yml/badge.svg)](https://github.com/bhsd-harry/Codemirror-CSS-color-picker/actions/workflows/codeql.yml)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/c8b651073b654da7b28bd348198cdafa)](https://app.codacy.com/gh/bhsd-harry/Codemirror-CSS-color-picker/dashboard)

A CodeMirror extension that adds a color picker input next to CSS color values. This is a fork of [@replit/codemirror-css-color-picker](https://www.npmjs.com/package/@replit/codemirror-css-color-picker).

## Usage

```ts
import {EditorState} from '@codemirror/state';
import {EditorView} from '@codemirror/view';
import {css} from '@codemirror/lang-css';
import {colorPicker} from '@bhsd/codemirror-css-color-picker';

new EditorView({
	parent: document.body,
	state: EditorState.create({
		doc: '.wow {\n\tcolor: #fff;\n}',
		extensions: [
			css(),
			colorPicker,
		],
	}),
});
```

## Todos

- Investigate solutions for alpha values. `input[type="color"]` does not support alpha values. We could show another number input next to it for the alpha value.
