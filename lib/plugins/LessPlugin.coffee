{Plugin, PluginType} = require('./Plugin')
os = require('os')

class LessPlugin extends Plugin
  constructor: (@omnis) ->
    super(@omnis)
    @tmp = os.tmpDir()

  type: ()-> PluginType.Static

  inject: (express)->
    lessMiddleware = require('less-middleware')
    @omnis.app.use(lessMiddleware(
      src: @omnis.path('public', 'stylesheets')
      dest: @tmp
      compress: @omnis.getEnvironment() == 'production'
      once: true
    ))
    @omnis.app.use(express.static(@tmp))

exports.LessPlugin = LessPlugin