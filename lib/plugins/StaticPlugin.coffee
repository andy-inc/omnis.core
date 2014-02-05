{Plugin, PluginType} = require('./Plugin')

class StaticPlugin extends Plugin

  type: ()-> PluginType.Static

  inject: (express)->
    @omnis.app.use(express.static(@omnis.path('public', '')))

exports.StaticPlugin = StaticPlugin