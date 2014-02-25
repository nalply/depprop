"use strict"



Tinytest.add("depprop - defineGetter with value", function(test) {
  var obj = {}
  var property = {}
  Object.defineGetter(obj, 'test', property)
  test.isTrue(obj.test === property, 'strict equality')

  test.equal(Object.getOwnPropertyDescriptor(obj, 'test'), {
    value: property,
    writable: false,
    enumerable: true,
    configurable: false,
  }, 'descriptor writable, enumerable and configurable')
})



Tinytest.add("depprop - defineGetter with function", function(test) {
  var obj = {}
  var property = {}
  function getProperty() { return property }
  Object.defineGetter(obj, 'test', getProperty)
  test.isTrue(obj.test === property, 'strict equality')

  var descriptor = Object.getOwnPropertyDescriptor(obj, 'test')
  test.equal(_.omit(descriptor, 'get'), {
    enumerable: true,
    configurable: false,
    set: undefined,
  }, 'descriptor enumerable, configurable and set')
  test.isTrue(descriptor.get === getProperty, 'getter function')
})



Tinytest.add("depprop - defineDepProperty", function(test) {
  var obj = {}
  var property = {}
  Object.defineDepProperty(obj, 'test')

  test.isUndefined(obj.test, 'unassigned property is undefined')

  var descriptor = Object.getOwnPropertyDescriptor(obj, 'test')
  test.equal(_.omit(descriptor, ['get', 'set']), {
    enumerable: true,
    configurable: true,
  }, 'descriptor check: enumerable and configurable')

  obj.test = property
  test.isTrue(obj.test === property, 'strict equality')

  var descriptor = Object.getOwnPropertyDescriptor(obj, '$test')
  test.equal(_.omit(descriptor, ['get', 'set']), {
    enumerable: true,
    configurable: true,
  }, 'descriptor check (with prefix): enumerable and configurable')

  obj.test = null
  test.isNull(obj.test, 'set to null')

  obj.$test = property
  test.isTrue(obj.test === property, 'strict equality (reactive set)')

  obj.$test = null
  test.isNull(obj.test, 'set to null (reactive)')

  obj.test = property
  test.isTrue(obj.$test === property, 'strict equality (reactive get)')
})



Tinytest.add("depprop - defineDepProperty context invalidation", function(test) {
  var obj = {}
  Object.defineDepProperty(obj, 'test')  
  
  var executionCount = 0
  Deps.autorun(function() { 
    ++executionCount
    console.log("obj.$test", obj.$test) // $test declares a dependency
  })
  test.equal(executionCount, 1, 'first run')
  
  obj.$test = "second"
  test.equal(executionCount, 1, 'not yet flushed')

  Deps.flush()
  test.equal(executionCount, 2, 'rerun after flush')

  obj.$test = "second"
  Deps.flush()
  test.equal(executionCount, 2, 'setting to same value no rerun')

  obj.property = "third"
  Deps.flush()
  test.equal(executionCount, 2, 'not reactively set')
})



Tinytest.add("depprop - not enumerable dependent property", function(test) {
  var obj = {}
  var descriptor


  Object.defineDepProperty(obj, 'notEnumerable', {enumerable: false})
  
  descriptor = Object.getOwnPropertyDescriptor(obj, 'notEnumerable')
  test.equal(_.omit(descriptor, ['get', 'set']), {
    enumerable: false,
    configurable: true,
  }, 'descriptor check: not enumerable but configurable')

  descriptor = Object.getOwnPropertyDescriptor(obj, '$notEnumerable')
  test.equal(_.omit(descriptor, ['get', 'set']), {
    enumerable: false,
    configurable: true,
  }, 'descriptor check (with prefix): not enumerable but configurable')
})



Tinytest.add("depprop - not configurable dependent property", function(test) {
  var obj = {}
  var descriptor
  Object.defineDepProperty(obj, 'notConfigurable', {configurable: false})

  descriptor = Object.getOwnPropertyDescriptor(obj, 'notConfigurable')
  test.equal(_.omit(descriptor, ['get', 'set']), {
    enumerable: true,
    configurable: false,
  }, 'descriptor check: not enumerable but configurable')

  descriptor = Object.getOwnPropertyDescriptor(obj, '$notConfigurable')
  test.equal(_.omit(descriptor, ['get', 'set']), {
    enumerable: true,
    configurable: false,
  }, 'descriptor check (with prefix): not enumerable but configurable')
})



Tinytest.add("depprop - dependent property equality", function(test) {
  var obj = {}
  
  Object.defineDepProperty(obj, 'normal', {equals: 'normal'})
  obj.normal = 42
  var executionCount1 = 0
  Deps.autorun(function() { 
    ++executionCount1
    console.log("obj.$normal", obj.$normal) // declare a dependency
  })


  obj.$normal = "42" // equal to 42 (not strictly equal)
  Deps.flush()
  test.equal(executionCount1, 1, 'equal, no rerun')

  obj.$normal = -42 // not equal to 42
  Deps.flush()
  test.equal(executionCount1, 2, 'not equal, rerun')


  Object.defineDepProperty(obj, 'always', {equals: 'always'})
  obj.always = 'always'
  var executionCount2 = 0
  Deps.autorun(function() {
    ++executionCount2
    console.log("obj.$always", obj.$always) // declare a dependency
  })

  obj.$always = 'always' // same but triggers rerun anyway
  Deps.flush()
  test.equal(executionCount2, 2, 'same but rerun anyway')
  

  var equalsResult = false
  var executionCount3 = 0
  function byFunction(a, b) {
    ++executionCount3
    return equalsResult
  }
  Object.defineDepProperty(obj, 'byFunction', {equals: byFunction})
  obj.byFunction = 'byFunction'
  var executionCount4 = 0
  Deps.autorun(function() {
    ++executionCount4
    console.log("obj.$byFunction", obj.$byFunction) // declare a dependency
  })

  obj.$byFunction = 'byFunction' // same but byFunction() returns false
  Deps.flush()
  test.equal(executionCount3, 1, 'byFunction() has been called')
  test.equal(executionCount4, 2, 'rerun because byFunction() returned false')

  equalsResult = true
  obj.$byFunction = 'different' // will be ignored
  Deps.flush()
  test.equal(executionCount3, 2, 'byFunction() has been called again')
  test.equal(executionCount4, 2, 'no rerun because byFunction() returned true')  
})



Tinytest.add("depprop - dependent property prefix", function(test) {
  function has(obj, name) { return obj.hasOwnProperty(name) }

  var obj = {}
  Object.defineDepProperty(obj, 'test', {prefix: '_'})
  test.isTrue(has(obj, 'test'), 'obj.test exists')
  test.isTrue(has(obj, '_test'), 'obj._test exists')

  Object.defineDepProperty(obj, 'test2', {prefix: 'reactive', prepend: false})
  test.isTrue(has(obj, 'test2'), 'obj.test2 exists')
  test.isTrue(has(obj, 'reactive'), 'obj.reactive exists')
  test.isTrue(has(obj.reactive, 'test2'), 'obj.reactive.test2 exists')
  var reactiveObject = obj.reactive

  Object.defineDepProperty(obj, 'test3', {prefix: 'reactive', prepend: false})
  test.isTrue(has(obj, 'test3'), 'obj.test3 exists')
  test.equal(obj.reactive, reactiveObject, 'object.reactive not recreated')
  test.isTrue(has(obj.reactive, 'test3'), 'obj.reactive.test3 exists')
})



Tinytest.add("depprop - onSet and onGet", function(test) {
  test.fail('Todo')
})


