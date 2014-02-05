{ JSV } = require('JSV')
{ HTTPError } = require('../../Omnis')

class ValidationFilter
  constructor: (@env = JSV.createEnvironment())->

  register: (schema)->
    @env.createSchema schema

  _validate: (schema, data)->
    validateResult = null
    if typeof schema == 'string'
      schema = @env.findSchema schema
      validateResult = schema.validate(data)
    else
      validateResult = @env.validate(data, schema)
    validateResult.errors = validateResult.errors.map (el)->
      result = {}
      for key, value of el
        continue if key == 'uri'
        result[key] = value
      delete result.schemaUri if result.schemaUri.indexOf('urn:uuid:') == 0
      return result;
    if validateResult.errors.length > 0
      return new ValidationError(validateResult.errors)
    else
      return null

  validate: (schema)->
    return (req, res, next)=>
      err = @_validate schema, req.body
      next(err)


class ValidationError extends HTTPError
  constructor: (err)->
    message = err.map((el) -> el.schemaUri + ": " + el.message).join('\n')
    name = "ValidationError"
    super 400, name, message, err


exports.ValidationFilter = new ValidationFilter()
exports.ValidationError = ValidationError