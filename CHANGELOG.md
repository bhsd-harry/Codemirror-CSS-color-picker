<!-- markdownlint-disable first-line-h1 -->
## 9.0.1

*2026-08-31*

**Changed**

- The checkerboard background to indicate transparency is changed

## 9.0.0

*2026-08-17*

**Added**

- A wider range of CSS color functions are now supported

**Changed**

- CSS colors are now parsed natively using [OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas) instead of [culori](https://culorijs.org/)
- When picking a new color for named colors or `hsl()`, the new color string will be either hex color literal (`#rrggbb`) or `rgba()`

## 8.0.3

*2026-08-16*

**Changed**

- When picking a new color for `transparent`, the new color string will be `rgb()` instead of hex color literal to achieve better browser compatibility
- The package is now compatible with ECMAScript 2019

## 8.0.1

*2026-07-16*

**Changed**

- Updated dependencies

## 8.0.0

*2026-06-11*

**Added**

- CSS colors with alpha values are now displayed with a checkerboard background to indicate transparency

**Changed**

- CSS colors are now parsed using [culori](https://culorijs.org/) instead of unmaintained [color-rgba](https://www.npmjs.com/package/color-rgba)

## 7.2.0

*2026-06-01*

**Changed**

- [CodeMirror 6](https://codemirror.net/) packages are now peer dependencies

## 7.1.1

*2026-05-20*

**Changed**

- Updated dependencies to resolve version conflicts

## 7.1.0

*2026-04-29*

**Fixed**

- RGB and HSL color component values can now be decimal numbers

## 7.0.0

*2026-04-27*

**Changed**

- This package is restructured
- CSS colors are now parsed using [color-rgba](https://www.npmjs.com/package/color-rgba) instead of simple regular expressions
