/**
 * Created by Andy <andy@sumskoy.com> on 27/02/14.
 */
var Omnis = require('./omnis').Omnis;

var _omnis;

module.exports = exports = function(pathOrName){
    if (_omnis == null) {
        return _omnis = new Omnis(pathOrName);
    } else {
        return _omnis.$application(pathOrName);
    }
};