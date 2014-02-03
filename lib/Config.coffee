
class Config
  constructor: (obj = {}, env = process.env)->
    #Update default params from env
    obj["$defaults"] ?= {}
    for key,value of env
      obj["$defaults"][key] = value

    #Extend all objects

    update = (data)->
      return data if typeof data != "string"
      args = data.match(/#{[A-Z, a-z, 0-9, _, -, \+, \.]+}/g)
      return data if not args? or args.length == 0

      for arg in args
        param = arg.substring(2, arg.length-1)
        data = data.replace(new RegExp(arg, "g"), obj["$defaults"][param].toString())
      return data

    walk = (data)->
      for key, value of data
        if value instanceof Object
          walk(value)
        else
          data[key] = update(value)
      return data

    obj = walk(obj)

    envName = env.NODE_ENV
    envName ?= obj["$defaults"].ENV if obj["$defaults"].ENV?
    envName ?= "development"

    for key, value of obj[envName]
      @[key] = value



exports.Config = Config