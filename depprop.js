"use strict"

// Define an enumerable read-only getter. The third parameter is either a
// function delivering the value or the value itself.
Object.defineGetter = function(obj, name, functionOrValue) {
  var descriptor = typeof functionOrValue == 'function'
    ? {get: functionOrValue, enumerable: true}
    : {value: functionOrValue, enumerable: true, writable: false}

  Object.defineProperty(obj, name, descriptor)
}



// Define an dependent property. It's like Meteor's Session but realized as
// JavaScript properties. A pair of getters and setters are defined. One is
// non-reactive and behaves like a normal property. The other has a prefix
// (by default it's the dollar sign) and has reactivity. Assigning to a
// reactive dependent property causes reactive contexts depending on it to be
// rerun. Getting a reactive dependent property in a reactive context will
// cause the context to be rerun if it has been invalidated.
//
// Options
//   enumerable: False to create a non-enumerable dependent property.
//   configurable: False to create a non-configurable dependent property.
//   prepend: False to create a sub-object to contain the reactive
//     property instead to prepend the prefix to the reactive property name.
//   prefix: The prefix for reactive property names. Default is '$'.
//   equals: Defines when to invalidate the dependents if the value has
//     changed in an reactive assignment. 'strict' means: Don't invalidate
//     if they are strictly equal. 'normal' if they are normally equal
//     (equality operator ==). 'always' means invalidate always. A function is
//     used to determine equality and should return true if the old and new
//     value are considered to be equal and no invalidation should happen.
//     Default is 'strict'.
//   onGet: A callback with signature (reactive, value, object, name, options)
//     invoked before each get. Return a falsy value to suppress the getter.
//     The parameter reactive is true for reactive access.
//     object, name and options are the same parameters as defineDepProperty()
//     except that options is initialized to contain default values if omitted.
//   onSet: A callback with signature (reactive, oldValue, newValue, object,
//     name, options) invoked before each set. Same signature as get, but with
//     an additional parameter to provide the new value to be set.
//   storeKey: The name of the store to contain the dependencies and the
//     property values. Default is '!depPopertyStore'.
Object.defineDepProperty = function(obj, name, options) {
  function noop() { return true }
  function never() { return false }

  options = options || {}
  options.enumerable      = options.enumerable !== false 
  options.configurable    = options.configurable !== false
  options.prepend         = options.prepend !== false
  options.prefix          = options.prefix || "$"
  options.equals          = options.equals || 'strict'
  options.onGet           = options.onGet || noop
  options.onSet           = options.onSet || noop
  options.storeKey        = options.storeKey = "!depPropertyStore"

  
  var equals = options.equals
  if (typeof equals != 'function') {
    if (equals == 'strict') equals = function(a, b) { return a === b }
    else if (equals == 'normal') equals = function(a, b) { return a == b }
    else if (equals == 'always') equals = never
    else {
      console.warn("options.equals neither 'strict', 'normal', 'always' nor"
        + " a function. Disabling reactivity.")
      equals = noop
    }
  }

  
  var storeKey = options.storeKey
  if (!obj[storeKey]) Object.defineGetter(obj, storeKey, {})
  var store = obj[storeKey]

  if (store[name]) {
    console.warn("There is already a dep property", name, "in the object")
    return
  }
  store[name] = Object.seal({value: void 0, dep: new Deps.Dependency})

  store = store[name]

  
  // Create property for non-reactive access
  Object.defineProperty(obj, name, {
    enumerable: options.enumerable, 
    configurable: options.configurable,
    get: function() {
      if (options.onGet(false, store.value, obj, name, options))
        return store.value
    },
    set: function(value) {
      if (options.onSet(false, store.value, value, obj, name, options))
        store.value = value
    },
  })

  
  // Create property for reactive access
  var prefix = options.prefix
  if (!options.prepend) {
    if (!obj[prefix]) Object.defineGetter(obj, prefix, {})
    obj = obj[prefix]
    prefix = ''
  }

  Object.defineProperty(obj, prefix + name, {
    enumerable: options.enumerable, 
    configurable: options.configurable,
    get: function() {
      if (options.onGet(true, store.value, obj, name, options)) {
        store.dep.depend()
        return store.value
      }
    },
    set: function(value) {
      if (options.onSet(true, store.value, value, obj, name, options)) {
        if (equals(store.value, value)) return
        store.value = value
        store.dep.changed()
      }
    },
  })
}
