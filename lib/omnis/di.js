/**
 * Created by Andy <andy@sumskoy.com> on 03/03/14.
 */
var $q = require('q');

var NS = require('./namespaces').Namespaces,
    annotations = require('../annotations'),
    getParamNames = annotations.getParamNames;

function DI(options){
    this._options = options;
    this._ns = new NS(options.debug);
    this._allModuleNames = [];
    this._allAnnotationNames = [];
    this._modules = [];
}

/**
 * Inject to function
 *
 * @param ns Namespace
 * @param filename Current file path
 * @param fn Function
 */
DI.prototype.inject = function(ns, filename, fn){
    if (ns == null){
        ns = this._ns.default;
    }
    if (fn == null) throw new Error("Can not inject to function " + fn);
    var self = this,
        params;
    if (Array.isArray(fn)){
        params = [].concat(fn);
        fn = params.pop();
    } else {
        params = getParamNames(fn);
    }
    //Check annotations
    if (filename){
        var annotationInfo = annotations.getSync(filename, true);
        for(var methodName in annotationInfo) if (annotationInfo.hasOwnProperty(methodName)){
            for(var annotationName in annotationInfo[methodName]) if (annotationInfo[methodName].hasOwnProperty(annotationName)){
                if (annotationInfo[methodName][annotationName] == null){
                    if (this._allAnnotationNames.indexOf(annotationName) === -1){
                        throw new Error("Annotation not found: " + annotationName + " in " + filename);
                    }
                }
            }
        }
    }
    //Find dependencies
    var args = [];
    for(var i = 0; i < params.length; i++) {
        var param = params[i];

        var arg = null;
        //System module or global module
        if (param.substr(0, 1) === '$'){
            try{
                arg = require(param.substr(1));
                args.push(arg);
                continue;
            } catch (e){
                //global module not found
                arg = null;
            }
            //Get as system module
            ns = '$system';
        }
        //Try to get dep
        arg = self._ns.get(ns + '.' + param);
        if (arg == null){
            arg = self._ns.get(self._ns.default + '.' + param);
        }
        if (arg == null){
            if (self._allModuleNames.indexOf(ns + '.' + param) == -1 && self._allModuleNames.indexOf(self._ns.default + '.' + param)){
                throw new Error("Module not found: " + annotationName + " in " + filename);
            }
            return undefined;
        }
        args.push(arg);
    }
    return function(){
        return fn.apply(self, args);
    }
};

/**
 * Register module for next initialization
 *
 * @param module
 * @returns {DI}
 */
DI.prototype.register = function(module){
    var m = {
        ns: module.ns || this._ns.default,
        name: module.name,
        filename: module.filename,
        fn: module.fn,
        type: module.type || 'module'
    };
    if (m.type === 'annotation'){
        this._allAnnotationNames.push(m.ns + '.' + m.name);
    } else if (m.type === 'system'){
        m.ns = '$system';
    } else {
        this._allModuleNames.push(m.ns + '.' + m.name);
    }
    this._modules.push(m);
    return this;
};

/**
 * Map Series for Promises
 * @param arr
 * @param iterator
 * @returns {promise}
 */
DI.prototype.mapSeries = function (arr, iterator) {
    var currentPromise = $q();
    var promises = arr.map(function (el) {
        return currentPromise = currentPromise.then(function () {
            return iterator(el)
        })
    });
    return $q.all(promises)
};

DI.prototype._declareAll = function(declare){

    var self = this;
    declare = declare || [].concat(self._modules);
    var size = declare.length;
    return this.mapSeries(declare, function(module){

        var deferred = $q.defer();
        self._declare(module).then(function(){
            declare.splice(declare.indexOf(module), 1);
            deferred.resolve();
        }, function(err){
            deferred.resolve();
        });

        return deferred.promise;

    }).then(function(){
        if (declare.length > 0) {
            if (declare.length === size){
                throw new Error("Circle dependence in: " + declare.map(function(el){ return el.name; }));
            } else {
                return self._declareAll(declare);
            }
        }  else {
            return true;
        }
    });
};

DI.prototype._declare = function(module){
    var self = this;
    var fn = module.fn,
        name = module.name,
        filename = module.filename,
        ns = module.ns,
        type = module.type;
    return $q.spread([ns, filename, fn], function(ns, filename, fn){
        return self.inject(ns, filename, fn);
    }).then(function(result) {
        if (result == null) {
            throw new Error("Can not resolve dependence for module: " + name);
        }
        return result();
    }).then(function(result){
        if (type === "annotation"){
            annotations.define(name, annotations.$method, result);
        } else {
            var res_module = result;
            return annotations.get(module.filename).then(function(ans){
                res_module.$_module = {
                    annotations: ans,
                    name: name
                };
                self._ns.register(ns + '.' + name, res_module);
                return true;
            });
        }
        return true;
    });
};

/**
 * Declare all modules
 * @returns {promise}
 */
DI.prototype.init = function(){
    var self = this;
    return this._declareAll().then(function(){
        self._modules = [];
    });
};

exports.DI = DI;