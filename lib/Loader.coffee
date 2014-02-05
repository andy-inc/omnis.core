path = require('path')
fs = require('fs')
yaml = require('js-yaml')
{ OmnisError } = require('./Error')

class Loader
  constructor: (basepath = __dirname)->
    @basepath = path.normalize basepath

  #Load config file
  rconfig: (name = "omnis")->
    _path = @path('config', name)
    if not fs.existsSync(_path)
      throw new FileNotFound(_path)
    else
      return yaml.safeLoad(fs.readFileSync(_path, 'utf8'))

  rcontroller: (name = "index")->
    _path = @path('controller', name)
    return require(_path)

  rrouter: (name = "router")->
    _path = @path('router', name)
    return require(_path)

  rmodel: (name = "index")->
    _path = @path('model', name)
    return require(_path)

  rview: (name = "index")->
    _path = @path('view', name)
    return _path

  #Get path of component
  path: (type, name)->
    subpath = name.split "#"
    name = subpath.pop()
    if type == 'config'
      subpath = [@basepath, "config"].concat(subpath)
      subpath.push( "#{name}.yaml")
    else if type in ['controller', 'model']
      res = [@basepath, "app"]
      for s in  subpath
        res.push("modules")
        res.push(s)
      res.push(type + "s")
      name = name.substr(0,1).toUpperCase() + name.substr(1) + type.substr(0, 1).toUpperCase() + type.substr(1)
      res.push(name)
      subpath = res
    else if type == 'view'
      cname = subpath.pop()
      res = [@basepath, "app"]
      for s in  subpath
        res.push("modules")
        res.push(s)
      res.push("views")
      res.push(cname)
      res.push(name)
      subpath = res
    else if type == 'public'
      subpath = [@basepath, "public"].concat(subpath)
      subpath.push(name)
    else if type == 'router'
      name = name.substr(0,1).toUpperCase() + name.substr(1)
      subpath = [@basepath, "app"].concat(subpath)
      subpath.push(name)
    path.join.apply(path, subpath)



class FileNotFound extends OmnisError
  constructor: (path)->
    message = if path then "Cannot find #{path}" else "Not Found"
    name = if path then "FileNotFound (#{path})" else "FileNotFound"
    super message, name, null

    @data.path = path

exports.Loader = Loader
exports.FileNotFound = FileNotFound