Package.describe({
  summary: 'Dependent JavaScript properties'
})

Package.on_use(function(api) {
  api.use('deps')

  api.add_files('depprop.js')
})

Package.on_test(function(api) {
  api.use(['depprop', 'tinytest', 'test-helpers', 'underscore'])
  api.add_files('depprop_tests.js', 'client')
})
