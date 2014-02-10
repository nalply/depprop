Tinytest.add("defineReadOnlyGetter with value", function(test) {
  var obj = {}
  var property = {}
  Object.defineReadOnlyGetter(obj, 'test', property)
  test.isTrue(obj.test === property, 'strict equality')

  test.equal(Object.getOwnPropertyDescriptor(obj, 'test'), {
    value: property,
    writable: false,
    enumerable: true,
    configurable: false,
  }, 'descriptor check: writable, enumerable and configurable')
})


Tinytest.add("defineReadOnlyGetter with function", function(test) {
  var obj = {}
  var property = {}
  function getProperty() { return property }
  Object.defineReadOnlyGetter(obj, 'test', getProperty)
  test.isTrue(obj.test === property, 'strict equality')

  var descriptor = Object.getOwnPropertyDescriptor(obj, 'test')
  test.equal(_.omit(descriptor, 'get'), {
    enumerable: true,
    configurable: false,
    set: undefined,
  }, 'descriptor check: enumerable, configurable and set')
  test.isTrue(descriptor.get === getProperty, 'getter function')
})


Tinytest.add("defineDepProperty", function(test) {
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


Tinytest.add("defineDepProperty context invalidation", function(test) {
  var obj = {}
  Object.defineDepProperty(obj, 'test')  
  
  var executionCount = 0
  Deps.autorun(function() {
    ++executionCount
    console.log("obj.$test", obj.$test)
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


Tinytest.add("defineDepProperty with options", function(test) {
  test.fail({type: "todo"})
})

