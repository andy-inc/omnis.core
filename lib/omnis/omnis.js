/**
 * Created by Andy <andy@sumskoy.com> on 27/02/14.
 */
var Application = require('./application').Application;

var Omnis = function(path){
    this._path = path;
    this._applications = {};
};

Omnis.prototype.$application = function(name){
    if (this._applications[name]){
        return this._applications[name];
    } else {
        return this._applications[name] = new Application(name, this);
    }
};

Omnis.prototype.$root = function(){
    return this._path;
};

exports.Omnis = Omnis;