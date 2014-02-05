{ Omnis } = require('../index')

app = new Omnis(__dirname)

app.start (err)->
  throw err if err
  console.log "Server started on #{app.config.server.ip}:#{app.config.server.port}" if not err