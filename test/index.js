const util = require('util')
const fs = require('fs')
const postcss = require('postcss')
const should = require('should')
const plugin = require('..')

Object.assign(util.inspect.defaultOptions, { colors: true, depth: 2 })

console.clear()

function transform(input, opts = {}, postcssOpts = {}) {
  return postcss()
    .use(plugin(opts))
    .process(input, postcssOpts)
}

describe('postcss-selector-property', () => {
  it('should work with nothing', () => {
    should.equal(transform(``).css, ``)
  })

  it('should work with simple selectors', () => {
    should.equal(transform(`
.a { color: blue }
.z { color: ref(.a, color) }
    `.trim()).css, `
.a { color: blue }
.z { color: blue }
    `.trim())
  })

  it('should work with multiple selectors', () => {
    should.equal(transform(`
.a,
.b { color: blue }
.x,
.z { color: ref(.a, color) }
    `.trim()).css, `
.a,
.b { color: blue }
.x,
.z { color: blue }
    `.trim())
  })

  it('should work with pseudo selectors', () => {
    should.equal(transform(`
.a { color: blue }
.a:hover:not(:first-child) { background: darkblue }
.z { background: ref(.a:hover:not(:first-child), background) }
    `.trim()).css, `
.a { color: blue }
.a:hover:not(:first-child) { background: darkblue }
.z { background: darkblue }
    `.trim())
  })

  it('should work with local selectors', () => {
    should.equal(transform(`
.a { color: blue; background: ref(&, color); border-color: ref(&-b, color) }
.a-b { color: red }
    `.trim()).css, `
.a { color: blue; background: blue; border-color: red }
.a-b { color: red }
    `.trim())
  })

  it('should work with chained selectors', () => {
    should.equal(transform(`
.a { color: blue }
.b { color: ref(.a, color) }
.c { color: ref(.d, color) }
.d { color: ref(.b, color) }
    `.trim()).css, `
.a { color: blue }
.b { color: blue }
.c { color: blue }
.d { color: blue }
    `.trim())
  })

  it('should work with fallback values when property is missing', () => {
    should.equal(transform(`
.a { color: blue }
.z { color: ref(.a, non-existent, white) }
    `.trim()).css, `
.a { color: blue }
.z { color: white }
    `.trim())
  })

  it('should work with fallback values when selector is missing', () => {
    should.equal(transform(`
.a { color: blue }
.m { color: ref(.n, color, #f00) }
    `.trim()).css, `
.a { color: blue }
.m { color: #f00 }
    `.trim())
  })

  it('should work within declaration functions', () => {
    should.equal(transform(`
.a { color: blue }
.b { color: var(--bbb, ref(.a, color)) }
.c { color: var(--ccc, ref(.b, color, orange)) }
.d { color: var(--ddd, ref(.z, color, purple)) }
    `.trim()).css, `
.a { color: blue }
.b { color: var(--bbb, blue) }
.c { color: var(--ccc, var(--bbb, blue)) }
.d { color: var(--ddd, purple) }
    `.trim())
  })
})
