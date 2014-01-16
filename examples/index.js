/**
 * Created by Andy <andy@sumskoy.com> on 20/12/13.
 */
var JSV = require('JSV').JSV;
JSV.env = JSV.createEnvironment();

var Core = require("../index").Core;
Core.controller(require('./controllers/simple'));
Core.controller(require('./controllers/simple_object'));
Core.controller(require('./controllers/validate'));
Core.controller(require('./controllers/validate_ex'));
Core.session('mongodb','fewfaweffawef', {}, {url: 'mongodb://localhost/test'});
Core.plugin(require('../plugins/validate')({environment: JSV.env}));
Core.init({root: __dirname + "/../", mode: 'debug'});
Core.on('error', function(err){
    console.error(err);
});
Core.start("http://localhost:3001", function(err){
    if (err) throw err;
});