{ Router } = require('../../lib/router/Router')

class ApplicationRouter extends Router
  constructor: (@omnis)->
    super @omnis

    @resource "frontend#simple"

    @root @redirectTo('frontend#simple#index')
    @root 'put', @redirectTo('/simple')
    @root 'post', '/simple'
    @match 'get','/simple_alias', '/frontend/simple/new'
    @match 'delete', '/simple_alias', '/frontend/simple/dd'

exports.Router = ApplicationRouter