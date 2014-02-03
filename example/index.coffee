{ Omnic } = require('../')

class TestApplication extends Omnis
  constructor: ()->
    super __dirname

app = new TestApplication()

app.start (err)->
  throw err if err