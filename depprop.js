// Define an enumerable read-only getter. The third parameter is either a
// function delivering the value or the value itself.
defineReadOnlyGetter = function(object, name, functionOrValue) {
  var descriptor = typeof functionOrValue == 'function'
    ? {get: functionOrValue, enumerable: true}
    : {value: functionOrValue, enumerable: true, writable: false}

  Object.defineProperty(object, name, descriptor)
}



// Define an dependent property. It's like Meteor's Session but realized as
// JavaScript properties. A pair of getters and setters are defined. One is
// non-reactive and behaves like a normal property. The other has a prefix
// (by default it's the dollar sign) and has reactivity. Assigning to a
// reactive dependent property causes reactive contexts depending on it to be
// rerun. Getting a reactive dependent property in a reactive context will
// cause the context to be rerun if it is assigned reactively.
//
// Options
//   enumerable: False to create a non-enumerable dependent property.
//   configurable: False to create a non-configurable dependent property.
//   reactivePrepend: False to create a sub-object to contain the reactive
//     property instead to prepend the prefix to the reactive property name.
//   reactivePrefix: The prefix for reactive property names. Default is '$'.
//   onGet: A callback with signature (reactive, value, object, name, options)
//     invoked before each get. Return a falsy value to suppress the getter.
//   onSet: A callback with signature (reactive, oldValue, newValue, object,
//     name, options) invoked before each set. Return a falsy value to
//     suppress the setter. The parameter reactive is true for reactive
//     accesses, else false. object, name and options are the same parameters
//     as passed to defineDepProperty() except that options contains the
//     default values.
//   storeKey: The name of the store to contain the dependencies and the
//     property values. Default is '!depPopertyStore'.
//   changeMode: Defines whether to invalidate the dependents if the value
//     has changed in an reactive assignment. 'strict' means: Don't invalidate
//     if they are strictly equal. 'equal' if they are equal. 'always' means
//     invalidate always. A different modus is normalized to 'always'. Default
//     if omitted is 'strict'.
defineDepProperty = function(object, name, options) {
  function noop() { return true }

  options = options || {}
  options.enumerable      = options.enumerable !== false 
  options.configurable    = options.configurable !== false
  options.onGet           = options.onGet || noop
  options.onSet           = options.onSet || noop
  options.storeKey        = options.storeKey = "!depPropertyStore"
  options.reactivePrefix  = options.reactivePrefix = "$"
  options.reactivePrepend = options.reactivePrepend !== false
  options.changeModus     = options.changeModus || 'strict'

  var strict = options.changeModus == 'strict'
  var equal = options.changeModus == 'equal'
  if (!strict && !equal) options.changeWhenEqual = 'always'

  var storeKey = options.storeKey
  if (!object[storeKey]) defineReadOnlyGetter(object, storeKey, {})
  var store = object[storeKey]

  if (store[name]) {
    console.warn("There is already a dep property", name, "in the object")
    return
  }
  store[name] = Object.seal({value: void 0, dep: new Deps.Dependency})

  store = store[name]

  // Create property for non-reactive access
  Object.defineProperty(object, name, {
    enumerable: options.enumerable, 
    configurable: options.configurable,
    get: function() {
      if (options.onGet(false, store.value, object, name, options))
        return store.value
    },
    set: function(value) {
      if (options.onSet(false, store.value, value, object, name, options))
        store.value = value
    },
  })

  // Create property for reactive access
  var prefix = options.reactivePrefix
  if (!options.reactivePrepend) {
    defineReadOnlyGetter(object, prefix, {})
    object = object[prefix]
    prefix = ''
  }
  Object.defineProperty(object, options.reactivePrefix + name, {
    enumerable: options.enumerable, 
    configurable: options.configurable,
    get: function() {
      if (options.onGet(true, store.value, object, name, options)) {
        store.dep.depend()
        return store.value
      }
    },
    set: function(value) {
      if (options.onSet(true, store.value, object, name, options)) {
        store.value = value
        if (strict && store.value === value) return
        if (equal && store.value == value) return
        store.dep.changed()
      }
    },
  })
}
