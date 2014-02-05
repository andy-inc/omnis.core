class BaseController

  constructor: (@omnis)->
    @_array_actions = []

  init: (cb)-> cb()

  beforeAction: (fn, actions = [])->
    if actions.length == 0
      actions = @_getActionsList()
    for key, value of @
      if actions.indexOf(key) != -1
        value = [value] if not Array.isArray(value)
        @[key] = [fn].concat(value)
        @_array_actions.push key

  _getActionsList: ()->
    _actions = []
    for key, value of @
      if key[0] != "_" and key != "init" and key != "beforeAction" and key != "constructor" and (@_isFunction(value) or @_array_actions.indexOf(key) != -1)
        _actions.push(key)
    return _actions

  _isFunction: (fn) ->
    getType = {}
    return fn && getType.toString.call(fn) == '[object Function]';

exports.BaseController = BaseController