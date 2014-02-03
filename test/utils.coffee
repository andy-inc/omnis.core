{ Loader } = require('../lib/Loader')
{ Config } = require('../lib/Config')
{ assert } = require("chai")

describe 'Loader', ()->

  loader = null

  before ()->
    loader = new Loader('example')

  describe 'load', ()->
    it 'should load config file', ()->
      assert.equal loader.path('config', 'omnis'), 'example/config/omnis.yaml'
      assert.isNotNull loader.rconfig('omnis')
    it 'should get right path to controller', ()->
      assert.equal loader.path('controller', 'omnis'), 'example/app/controllers/omnis'
      assert.equal loader.path('controller', 'simple.omnis'), 'example/app/modules/simple/controllers/omnis'
      assert.equal loader.path('controller', 'simple.test.omnis'), 'example/app/modules/simple/modules/test/controllers/omnis'

describe 'Config', ()->

  it 'should load simple config', ()->
    cfg =
      "$defaults":
        ENV: "development"
        IP: "localhost"
        PORT: 3001
        MURL: "mongodb://localhost/omnis"
      production:
        url: 'http://#{IP}:#{PORT}'
        db:
          url: '#{MURL}'
    conf = new Config cfg, {NODE_ENV: "production"}
    assert.equal(conf.url, "http://localhost:3001")
    assert.equal(conf.db.url, "mongodb://localhost/omnis")
