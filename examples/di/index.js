/**
 * Created by Andy <andy@sumskoy.com> on 03/03/14.
 */
var di = require('./di').di,
    util = require('util');
require('./config');
require('./controller');
require('./model');
require('./annotation');
di.init().then(function(){
    console.log(util.inspect(di._ns, { showHidden: true, depth: null, colors: true }));
});
