# postcss-selector-property

Find and use CSS properties with selectors.

## Summary

Use `ref(selector, property, fallback?)` in your properties
to retrieve the value for `property` that exists at `selector`, with
an optional `fallback`.

See examples below for details.

## Install

Install with `npm` or `yarn`.

```shell
npm install postcss-selector-property --save-dev
```

```shell
yarn add postcss-selector-property -D
```

## Examples

From `/test/index.js`.

### Simple selectors

```css
.a { color: blue }
.z { color: ref(.a, color) }
```

Becomes

```css
.a { color: blue }
.z { color: blue }
```

### Compound selectors

```css
.a,
.b { color: blue }
.x,
.z { color: ref(.a, color) }
```

Becomes

```css
.a,
.b { color: blue }
.x,
.z { color: blue }
```

### Pseudo selectors

```css
.a { color: blue }
.a:hover:not(:first-child) { background: darkblue }
.z { background: ref(.a:hover:not(:first-child), background) }
```

Becomes

```css
.a { color: blue }
.a:hover:not(:first-child) { background: darkblue }
.z { background: darkblue }
```

### Local selectors

Use the `&` sigil to substitute the current selector, like in SASS, LESS, etc.

```css
.a { color: blue; background: ref(&, color); border-color: ref(&-b, color) }
.a-b { color: red }
```

Becomes

```css
.a { color: blue; background: blue; border-color: red }
.a-b { color: red }
```

### Chained properties

```css
.a { color: blue }
.b { color: ref(.a, color) }
.c { color: ref(.d, color) }
.d { color: ref(.b, color) }
```

Becomes

```css
.a { color: blue }
.b { color: blue }
.c { color: blue }
.d { color: blue }
```

### Fallbacks

Fallbacks work when the referenced property is missing:

```css
.a { color: blue }
.z { color: ref(.a, non-existent, white) }
```

Becomes

```css
.a { color: blue }
.z { color: white }
```

And they work when the referenced selector is missing:

```css
.a { color: blue }
.m { color: ref(.n, color, #f00) }
```

Becomes

```css
.a { color: blue }
.m { color: #f00 }
```

## License

MIT
