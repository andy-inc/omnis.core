{ BaseController } = require('../../../../../lib/router/BaseController')
{ ValidationFilter } = require('../../../../../lib/router/filters/ValidationFilter')

validation_schema =
  $schema: "http://json-schema.org/draft-03/schema#"
  id: "auth:user#"
  type: "object"
  additionalProperties: false
  properties:
    fio:
      type: "string"
      required: true

class SimpleController extends BaseController
  constructor: (@omnis) ->
    super @omnis
    @beforeAction ValidationFilter.validate(validation_schema), ['update']

  index: (req, res, next)->
    res.render({data: "test"})

  create: (req, res, next)->
    req.session.userId = "UserId"
    res.render('index', {data: "Created"})

  show: (req, res, next)->
    res.render('index', {data: req.param("id", "no-id")})

  update: (req, res, next)->
    res.render('index',req.body)

  destroy: (req, res, next)->
    delete req.session.userId
    res.render('index', {data: "Desprtoyes"})



exports.SimpleController = SimpleController