{Plugin, PluginType} = require('../Plugin')

class MongoSessionPlugin extends Plugin
  type: ()-> PluginType.SessionStore

  inject: (express)->
    #try to load config
    try
      @config = @omnis.rconfig("plguins#session")
    catch e
      @config =
        url: @omnis.config.db.url + "/sessions"
        reconnect: true
    MongoStore = require('connect-mongo')(express)
    return new MongoStore(@config)


exports.MongoSessionPlugin = MongoSessionPlugin