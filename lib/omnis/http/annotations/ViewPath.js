/**
 * Created by Andy <andy@sumskoy.com> on 28/02/14.
 */
var $util = require('util'),
    $path = require('path');
var BeforeRoute = require('./BeforeRoute');

var ViewPath = function(path, $default, $dirname){
    path = path || $default;
    if (path){
        path = path.replace(/\$__dirname/, $dirname);
    }
    BeforeRoute.call(this);
    this.path = path;
};

$util.inherits(ViewPath, BeforeRoute);

ViewPath.prototype.middleware = function(req, res){
    res.$viewRoot = this.path;
};

ViewPath.prototype.module = function(annotation){
    if (annotation.path.substr(0, 1) !== '/'){
        return new ViewPath($path.join(this.path, annotation.path));
    } else {
        return annotation;
    }
};

module.exports = exports = ViewPath;