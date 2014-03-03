/**
 * Created by Andy <andy@sumskoy.com> on 26/02/14.
 */

var $q = require('q'),
    $path = require('path');

var core = require('./core');
var annotations = [];

var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
var getParamNames = function (func) {
    var fnStr = func.toString().replace(STRIP_COMMENTS, '');
    var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(/([^\s,]+)/g);
    if(result === null)
        result = [];
    return result
};

var applyToConstructor = function (constructor, argArray) {
    var args = [null].concat(argArray);
    var factoryFunction = constructor.bind.apply(constructor, args);
    return new factoryFunction();
};

exports.$method = "METHOD";

exports.define = function(name, target, constructor){
    annotations[name] = {
        target: target,
        constructor: constructor
    };
    return exports;
};

var mapAnnotations = function(result, filename, allowNoAnnotations){
    for(var name in result) if (result.hasOwnProperty(name)){
        var anns = result[name];
        if (Object.keys(anns).length === 0){
            delete result[name];
            continue;
        }
        for(var an in  anns) if (anns.hasOwnProperty(an)){
            var value = anns[an];
            if (typeof value != "string") value = "";

            var args = {};
            var m;
            var matcher = {
                regexp: /(?:(\w+)(?:\s+)?=(?:\s+)?)?(?:(?:"([^"]+)?")|(?:'([^']+)?')|(?:([0-9]+))|(?:(true|false|null)))/img,
                $name: 1,
                $default: 2,
                $string: 3,
                $number: 4,
                $boolean: 5
            };
            while ((m = matcher.regexp.exec(value)) != null) {
                var $default = m[matcher.$default],
                    $name = m[matcher.$name],
                    $str = m[matcher.$string],
                    $num = m[matcher.$number],
                    $bool = m[matcher.$boolean];
                var val = $str;
                if (val == null) val = $default;
                if (val == null) val = ($num != null ? parseInt($num, 10) : $num);
                if (val == null) val = ($bool != null ? ($bool === 'true' ? true : ($bool === 'false' ? false : null)) : $bool);
                if (val === undefined) continue;
                if ($name == null){
                    args.$default = val;
                    break;
                }  else {
                    args[$name] = val;
                }
            }

            args["$dirname"] = $path.dirname(filename);
            args["$filename"] = filename;

            var annotation = annotations[an];
            if (annotation == null) {
                if (allowNoAnnotations){
                    anns[an] = null;
                    continue;
                } else {
                    delete anns[an];
                    continue;
                }
            }
            var params = getParamNames(annotation.constructor);

            params = params.map(function(name){
                return args[name];
            });

            var obj = applyToConstructor(annotation.constructor, params);
            anns[an] = obj;
        }
    }
    return result;
};

exports.getSync = function(filename, allowNoAnnotations){
    var result = core.getSync(filename);
    result = mapAnnotations(result, filename, allowNoAnnotations);
    return result;
};

exports.get = function(filename, allowNoAnnotations){
    var deferred = $q.defer();
    core.get(filename, function(err, result){
        if (err) return deferred.reject(err);
        result = mapAnnotations(result, filename, allowNoAnnotations);
        return deferred.resolve(result);
    });
    return deferred.promise;
};

exports.getParamNames = getParamNames;