import postcss from 'postcss'

export default postcss.plugin('postcss-selector-property', (opts = {}) => {
  return (css, result) => {
    // resolved matches
    const resolved = []
    // fallbacks
    const fallbacks = new Map()
    // decl selectors
    const dsels = {}
    // unmatched decl selectors
    const udsels = new Set(Object.keys(dsels))

    // find reference decls that use
    // the `ref(...)` syntax
    css.walkDecls(decl => {
      const match = /ref\(([^,]*),([^\),]*)(,([^\)]*))?\)/g.exec(decl.value)
      if (match) {
        const dsel = match[1].trim().replace(/&/g, decl.parent.selector)
        const dprop = match[2].trim()
        const dfallback = match[4] ? match[4].trim() : null

        let dprops = dsels[dsel]
        if (!dprops) dprops = dsels[dsel] = {}

        let ddecls = dprops[dprop]
        if (!ddecls) ddecls = dprops[dprop] = []

        if (dfallback) {
          Object.defineProperty(dprops, 'fallback', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: dfallback
          })
        }

        // push the reference decls
        // onto a list, to be updated
        // at the end
        ddecls.push(decl)
      }
    })

    // walk rules and find any selectors
    // referenced in the above decls
    css.walkRules(rule => {
      // rule props
      const rprops = {}
      // rule decls
      const rdecls = rule.nodes
      // rule selectors
      const rsels = rule.selector.split(',').map(rsel => rsel.trim())
      // matched rule selectors
      const mrsels = []

      // see if any rule selectors match decl selectors
      for (const rsel of rsels) {
        if (dsels.hasOwnProperty(rsel)) {
          // remove rule selector from unmatched decl selectors
          udsels.delete(rsel)
          // add rule selector to matched rule selectors
          mrsels.push(rsel)
        }
      }

      // create an object of rule prop keys and rule values
      for (const rdecl of rdecls) {
        rprops[rdecl.prop] = rdecl
      }

      // iterate over decl selectors
      for (const dsel in dsels) {
        // get the outstanding decl props
        // associated with the decl selector
        const dprops = dsels[dsel]

        // check if matched rule selectors includes
        // the current selector
        if (mrsels.includes(dsel)) {
          // iterate over the props
          for (const dprop in dprops) {
            // the decl whose value we will use
            const rdecl = rprops[dprop]

            // the decls whose value will be changed
            const ddecls = dprops[dprop]

            // if the current rule has the outstanding prop,
            // get the decl and add it to the matched props list
            if (rprops.hasOwnProperty(dprop)) {
              // get value from current rule decl
              const rvalue = rdecl.value
              // push the selector, prop name,
              // the decls to be updated, and
              // the decl to be referenced
              resolved.push({ dsel, dprop, ddecls, rdecl, rvalue })
            } else if (dprops.hasOwnProperty('fallback')) {
              // use fallback instead of rule decl value
              const rvalue = dprops.fallback

              // add to special fallbacks map
              fallbacks.set(ddecls, rvalue)
            }
          }
        }
        // if fallback value is set, use it
        else if (dprops.hasOwnProperty('fallback')) {
          // set value to fallback
          const rvalue = dprops.fallback

          // iterate props that use selector
          // and add to fallbacks
          for (const dprop in dprops) {
            const ddecls = dprops[dprop]
            fallbacks.set(ddecls, rvalue)
          }
        }
      }
    })

    // if a selector appears in a reference
    // decl but it not found, throw an error
    if (udsels.size) {
      const unresolvedDeclSels = Array.from(udsels)
      const unresolvedList = '"' + unresolvedDeclSels.map(`", "`) + '"'
      throw new Error(`Unresolved selectors: ${unresolvedList}`)
    }

    // if we resolved any reference decls,
    // we need to update their values
    if (resolved.length) {
      for (const { dsel, dprop, ddecls, rdecl } of resolved) {
        // console.log('resolved', dsel, dprop, ddecls, rdecl)

        // iterate over reference decls to update
        for (const ddecl of ddecls) {
          // assign the rule's decl value to each reference
          ddecl.value = rdecl.value
        }

        // remove fallback if we found
        // the value elsewhere
        if (fallbacks.has(ddecls)) {
          fallbacks.delete(ddecls)
        }
      }
    }

    if (fallbacks.size) {
      // iterate over fallback decls
      for (const [ddecls, rvalue] of fallbacks.entries()) {
        for (const ddecl of ddecls) {
          // assign each decl's value to the fallback value
          ddecl.value = rvalue
        }
      }
    }
  }
})
