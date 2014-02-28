/**
 * Created by Andy <andy@sumskoy.com> on 28/02/14.
 */
var util = require('util');
var BeforeRoute = require('./BeforeRoute');

var ViewPath = function(path, $default, $dirname){
    path = path || $default;
    if (path){
        path = path.replace(/\$__dirname/, $dirname);
    }
    BeforeRoute.call(this);
    this.path = path;
};

util.inherits(ViewPath, BeforeRoute);

ViewPath.prototype.getMiddleware = function(){
    var self = this;
    return function(req, res, next){
        res.$viewRoot = self.path;
        next();
    };
};

module.exports = exports = ViewPath;