Package.describe({
  summary: 'Dependent JavaScript properties'
})

Package.on_use(function (api) {
  api.add_files('depprop.js', 'client')
  
  api.export('defineDepProperty')
  api.export('defineReadOnlyGetter')
})
