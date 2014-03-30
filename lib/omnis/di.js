/**
 * Created by Andy <andy@sumskoy.com> on 03/03/14.
 */
var $q = require('q');

var NS = require('./namespaces').Namespaces,
    annotations = require('../annotations'),
    getParamNames = annotations.getParamNames,
    OmnisError = require('./errors/OmnisError').OmnisError;

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
 * @param req Require function for module
 */
DI.prototype.inject = function(ns, filename, fn, req){
    if (req == null) req = require;
    if (ns == null){
        ns = this._ns.default;
    }
    if (fn == null) throw new OmnisError("Can not inject to function " + fn);
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
                        throw new OmnisError("Annotation not found: " + annotationName + " in " + filename);
                    }
                }
            }
        }
    }
    var findDependencie = function(param, allowException){
        var arg = null;
        //System module or global module
        if (param.substr(0, 1) === '$'){
            try{
                arg = req(param.substr(1));
                return arg;
            } catch (e){
                try{
                    arg = require(param.substr(1));
                    return arg;
                } catch (e){
                    //global module not found
                    arg = null;
                }
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
            arg = self._ns.get(param);
        }
        if (arg == null){
            if (allowException) {
                if (self._allModuleNames.indexOf(ns + '.' + param) == -1 &&
                    self._allModuleNames.indexOf(self._ns.default + '.' + param) == -1 &&
                    self._allModuleNames.indexOf(param) == -1) {
                    throw new OmnisError("Module not found: " + param + " in " + filename);
                }
                return undefined;
            } else {
                param = param.replace(/([A-Z])/g, function($1){return "-"+$1.toLowerCase();});
                return findDependencie(param, true);
            }
        }
        return arg;
    };
    //Find dependencies
    var args = [];
    for(var i = 0; i < params.length; i++) {
        var param = params[i];
        var arg = findDependencie(param);
        if (arg === undefined) return undefined;
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
        type: module.type || 'module',
        require: module.require || require
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
            if (!(err instanceof OmnisError)){
                deferred.reject(err);
            } else {
                deferred.resolve();
            }
        });

        return deferred.promise;

    }).then(function(){
            if (declare.length > 0) {
                if (declare.length === size){
                    throw new OmnisError("Circle dependence in: " + declare.map(function(el){ return el.ns + '.' + el.name; }));
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
        type = module.type,
        req = module.require;
    return $q.spread([ns, filename, fn, req], function(ns, filename, fn, req){
        return self.inject(ns, filename, fn, req);
    }).then(function(result) {
            if (result == null) {
                throw new OmnisError("Can not resolve dependence for module: " + name);
            }
            return result();
        }).then(function(result){
            if (type === "annotation"){
                annotations.define(name, annotations.$method, result);
            } else {
                var res_module = result;
                return $q.spread([module.filename], function(fn){
                    if (fn){
                        return annotations.get(fn);
                    } else {
                        return {};
                    }
                }).then(function(ans){
                    res_module.$_module = {
                        annotations: ans,
                        name: name,
                        type: type
                    };
                    self._ns.register(ns + '.' + name, res_module);
                    return true;
                });
            }
            return true;
        });
};

DI.prototype.getAllModulesName = function(){
    return [].concat(this._allModuleNames);
};

DI.prototype.getModule = function(fullname){
    return this._ns.get(fullname);
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

DI.prototype.setDebug = function(value){
    this._options.debug = value;
    this._ns.setDebug(value);
};

exports.DI = DI;