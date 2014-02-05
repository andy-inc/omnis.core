class OmnisError extends Error
  constructor: (message, name = "OmnisError", extention = null)->
    @data =
      message: message
      name: name
      extention: @_explayExtention(extention)
    @name = name
    @message = message
    Error.call @, message
    Error.captureStackTrace @, arguments.callee

  toJSON: ()-> @.data

  _explayExtention: (extention)->
    return null if not extention?

    if extention instanceof Error
      return {
        name: extention.name
        message: extention.message
      }
    else if extention instanceof OmnisError
      return extention.toJSON()
    else
      return extention


exports.OmnisError = OmnisError