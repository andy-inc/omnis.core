{ Loader } = require('./Loader')
{ Config } = require('./Config')
{ OmnisError } = require('./Error')
{ PluginType } = require('./plugins/Plugin')
express = require('express')
fs = require('fs')
path  = require('path')
async = require('async')
http = require('http')
swig = require('swig')

class Omnis extends Loader
  constructor: (basepath = __dirname)->
    super basepath

    #Load omnis config
    @config = new Config(@rconfig('omnis'))

    @_initExpress()

  #Init express
  _initExpress: ()->
    #Load all plugins
    pnames = @config.plugins ? []
    @plugins = []
    for s in pnames
      s = s.split('#')
      s[s.length-1] += "Plugin"
      pluginName = s[s.length-1]
      pluginPath = path.join.apply(path, [__dirname, 'plugins'].concat(s))
      @plugins.push
        name: pluginName
        value: new (require(pluginPath)[pluginName])(@)

    #Init session store
    store = null
    for plugin in @plugins
      if plugin.value.type() == PluginType.SessionStore
        store = plugin.value.inject(express)
        break


    @app = express()

    #Template Engine
    @app.engine('html', swig.renderFile)
    @app.set('view engine', 'html')
    @app.set('views', @path('view', ''))

    #Enable cache in production
    if "production" == @config.environment
      swig.setDefaults({ cache: false })
      @app.set('view cache', true)
    else
      @app.set('view cache', false)
      swig.setDefaults({ cache: false })
    #Middlewares
    @app.use express.methodOverride()
    @app.use express.urlencoded()

    @app.use express.cookieParser()
    @app.use express.session
      secret: @config.server.secret
      store: store
      cookie: @config.server.cookie

    @app.use express.json()
    @app.use express.logger() if 'production' != @config.environment
    @app.use (req, res, next)->
      res._render = res.render
      next()

    router = new (@rrouter().Router)(@)
    router.inject(express)
    #Routes
    @app.use @app.router

    #Static middlewares
    for plugin in @plugins
      if plugin.value.type() == PluginType.Static
        plugin.value.inject(express)

    #Not Found
    @app.use (req, res, next)->
      next new HTTP404()

    #Error handler middlewares
    for plugin in @plugins
      if plugin.value.type() == PluginType.ErrorHandler
        plugin.value.inject(express)

    #Error
    @app.use (err, req, res, next)=>
      err = new HTTP500(err) if not (err instanceof HTTPError)
      console.trace err
      code = err.code
      if req.xhr
        res.send status, err.toJSON()
      else
        data = if 'production' != @config.environment then err else null
        res.status(code)
        res._render(path.join(__dirname, 'templates', "E#{code}"), {error: data})


  getEnvironment: ()-> @config.environment

  start: (cb)->
    async.waterfall [
      (cb)=>
        async.eachSeries @plugins, (plugin, next)->
          plugin.value.init(next)
        , (err) -> cb(err)
      (cb)=>
        http
        .createServer(@app)
        .listen @config.server.port, @config.server.ip, (err)-> cb(err)
    ], cb

  stop: ()->

class HTTPError extends OmnisError
  constructor: (@code, @name, @message, @err)->
    super message, @name, @err

class HTTP404 extends HTTPError
  constructor: ()->
    super 404, "ErrorHTTP404", "No route found for request", null

class HTTP500 extends HTTPError
  constructor: (err)->
    if not (err instanceof Error)
      err = new Error(err)
    name = "ErrorHTTP500 (#{err.message})"
    message = err.message
    super 500, name, message, err

exports.Omnis = Omnis
exports.HTTP404 = HTTP404
exports.HTTP500 = HTTP500
exports.HTTPError = HTTPError