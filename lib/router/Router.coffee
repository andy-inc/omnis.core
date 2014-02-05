async = require('async')

class Router
  constructor: (@omnis)->
    @routes =
      get: []
      post: []
      put: []
      delete: []
    @middlewares = []
    @uris = {}

  inject: (express)->
    for key, value of @routes
      for route in value
        do (key, value, route)=>
          console.log "Route - #{key}: #{route.uri}    #{route.cname + "#" + route.action}"
          @omnis.app[key](route.uri, [
            (req, res, next)=>
              res._render = res.render
              res.render = (template, data)=>
                if not data?
                  data = template
                  template = route.cname + "#" + route.action
                else
                  template = route.cname + "#" + template
                res._render(@omnis.rview(template), data)
              next()
          ].concat(route.fn))
    for middleware in @middlewares
      @omnis.app.use middleware

  _loadController: (cname)->
    name = cname.split("#").pop()
    name = name.substr(0,1).toUpperCase() + name.substr(1)
    result = {}
    controller = new (@omnis.rcontroller(cname))[name+"Controller"](@omnis)
    actions = controller._getActionsList()
    for action in actions
      result[action] = controller[action]
    return result
  resource: (cname, curi) ->
    @uris[cname] ?= {}
    curi ?= '/' + cname.replace(/#/g,'/')
    controller = @_loadController(cname)
    for action, fn of controller
      isCreation = if action in ['create', 'new'] then true else false
      method = 'get' if action in ['index','list', 'all', 'show','get', 'edit', 'create', 'new']
      method = 'post' if action in ['insert']
      method = 'put' if action in ['update', 'save']
      method = 'delete' if action in ['delete', 'destroy']
      @uris[cname][action] = {uri: curi, method: method, cname: cname, action: action} if action in ['index','list', 'all']
      @uris[cname][action] = {uri: curi+ "/new", method: method, cname: cname, action: action} if action in ['create', 'new']
      @uris[cname][action] = {uri: curi+ "/:id", method: method, cname: cname, action: action} if action in ['show','get']
      @uris[cname][action] = {uri: curi+ "/:id/edit", method: method, cname: cname, action: action} if action in ['edit']
      @uris[cname][action] = {uri: curi+ "/", method: method, cname: cname, action: action} if action in ['insert']
      @uris[cname][action] = {uri: curi+ "/:id", method: method, cname: cname, action: action} if action in ['update', 'save']
      @uris[cname][action] = {uri: curi+ "/:id", method: method, cname: cname, action: action} if action in ['delete', 'destroy']

      if @uris[cname][action]?
        if isCreation
          @routes[@uris[cname][action].method].unshift
            uri: @uris[cname][action].uri
            fn: fn
            cname: cname
            action: action
        else
          @routes[@uris[cname][action].method].push
            uri: @uris[cname][action].uri
            fn: fn
            cname: cname
            action: action
    return null
  root: (method, dest)->
    if not dest?
      dest = method
      method = null
    @match method, '/', dest

  match: (method, uri, dest)->
    if not dest?
      dest = uri
      uri = method
      method = null
    method = method.toUpperCase() if method

    fn = @_getRedirectDest(dest)
    if Array.isArray(fn)
      fns = fn
      fn = (req, res, next)->
        async.eachSerias fns, (fn, next) ->
          fn(req, res, next)
        , next
    @middlewares.push (req, res, next)=>
      if req.url == uri and (req.method == method or method == null)
        fn(req, res, next)
      else
        next()

  redirectTo: (dest)-> @_getRedirectDest(dest)

  _getRedirectDest: (dest)->
    fn = (req, res, next)-> next()
    if @_isFunction(dest)
      fn = dest
    else
      if dest[0] != '/'
        s = dest.split "#"
        action = s.pop()
        cname = s.join "#"
        dest = @uris?[cname]?[action]?.uri
        if not dest?
          controller = @_loadController(cname)
          fn = controller[action]
        else
          fn = (req, res, next)->
            req.url = dest
            next()
      else
        fn = (req, res, next)->
          req.url = dest
          next()
    return fn

  _isFunction: (fn) ->
    getType = {}
    return fn && getType.toString.call(fn) == '[object Function]';

exports.Router = Router