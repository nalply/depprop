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
	})
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
	})
	test.isTrue(descriptor.get === getProperty, 'getter function')
})

