/**
 * Created by Andy <andy@sumskoy.com> on 20/12/13.
 */
var JSV = require('JSV').JSV;
JSV.env = JSV.createEnvironment();

var errors = require('../lib/errors');

var auth = require('../plugins/authorization')();
auth.addRule('default', function(controller, url, method, session, req, callback){
    if (req.body.auth){
        callback();
    } else {
        callback(new errors.OmnisAuthorizationUnauthorized());
    }
});

var Core = require("../index").Core;
Core.controller(require('./controllers/simple'));
Core.controller(require('./controllers/simple_object'));
Core.controller(require('./controllers/validate'));
Core.controller(require('./controllers/validate_ex'));
Core.controller(require('./controllers/auth'));
Core.session('mongodb','fewfaweffawef', {}, {url: 'mongodb://localhost/test'});
Core.plugin(auth);
Core.plugin(require('../plugins/validate')({environment: JSV.env}));
Core.init({root: __dirname + "/../", mode: 'debug'});
Core.on('error', function(err){
    console.error(err);
});
Core.start("http://localhost:3001", function(err){
    if (err) throw err;
});