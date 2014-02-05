
class Plugin
  constructor: (@omnis) ->
  type: ()-> exports.PluginType.Unknown
  init: (cb) -> cb()
  inject: (express)->


exports.Plugin = Plugin
exports.PluginType =
  Unknown: "Unknown"
  SessionStore: "SessionStore"
  Static: "StaticSender"
  ErrorHandler: "ErrorHandler"
  Route: "Route"