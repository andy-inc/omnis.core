/**
 * Created by Andy <andy@sumskoy.com> on 26/02/14.
 */
exports.$annotations = require('./lib/annotations');

var Omnis = require('./lib/omnis');
var omnisInstance = null;

exports.$omnis = function(){
   if (omnisInstance){
       return omnisInstance;
   } else {
       var args = [null].concat(Array.prototype.slice.call(arguments));
       var factoryFunction = Omnis.bind.apply(Omnis, args);
       omnisInstance = new factoryFunction();
       return omnisInstance;
   }
};