/**
 * Created by andy <andy.sumskoy@gmail.com> on 16/01/14.
 */

var $util = require('util');

module.exports = exports = {
    OmnisValidationModelNotFound: "Omnis.Validation: model not found: $0",
    OmnisValidationFailed: "Omnis.Validation: validation failed, model: $0",
    OmnisAuthorizationAccessDenied: "Omnis.Authorization: Access Denied",
    OmnisAuthorizationUnauthorized: "Omnis.Authorization: Unauthorized",
    OmnisAuthorizationRuleNotFound: "Omnis.Authorization: rule not found: $0",
    OmnisAuthorizationNoRuleForMethod: "Omnis.Authorization: no rule for method"
};

/**
 * Completed exports error wrapper
 * @param {String} code
 * @param {String} message
 * @param {Object} exception
 * @constructor
 */
var CompletedError = function(code, message, exception){
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);
    this.code = code;
    this.message = message;
    var params = message.match(/\$\d+/g) || [];
    if (params.length === 0){
        this.exception = exception;
    } else {
        params.forEach(function(el){
            var p = exception.shift();
            if (p == null) p = "null";
            this.message = this.message.replace(el, p.toString());
        }.bind(this));
        if (exception.length == 0) exception = null;
        else if (exception.length == 1) exception = exception[0];
        this.exception = exception;
    }
};

$util.inherits(CompletedError, Error);

/**
 * Overwrite toString method
 * @returns {String}
*/
CompletedError.prototype.toString = function(){
    var exp = this.exception;
    if (exp) {
        if (exp.code && exp.message) {
            exp = exp.toString(true);
        } else {
            exp = $util.inspect(exp);
        }
    }
    return "#" + this.code + ": " + this.message + (exp != null? " (" + exp + ")": "");
};

/**
 * Return JSON Object
 * @returns {Object}
 */
CompletedError.prototype.toJSON = function(){
    var result = {
        code: this.code,
        message: this.message
    };
    if (this.exception != null){
        if (this.exception.toJSON != null){
            result.exception = this.exception.toJSON();
        } else {
            result.exception = $util.inspect(this.exception);
        }
    }
    return result;
};

/**
 * Create object for each error like {code: string, message: string, exception: objects}
 */


/**
 * Check error instance of declared Error
 * @param {Error} err Current Error
 * @param {Function} constructor Constructor of declared Error
 * @returns {boolean}
 */
var _instanceof = function(err, constructor){
    var name = '';
    for(var key in this) if (this.hasOwnProperty(key)){
        if (this[key] == constructor){
            name = key;
            break;
        }
    }
    return (err.code === name);
};

/**
 * Create object for each error like {code: string, message: string, exception: objects}
 * @param {Object} obj
 */
exports.compile = function(obj){
    obj.compile = exports.compile;
    obj.instanceof = _instanceof.bind(obj);

    for(var key in obj) if (obj.hasOwnProperty(key) && key !== "compile" && key !== "instanceof"){
        var error = obj[key];
        (function(key, message) {
            obj[key] = function(){
                var args = Array.prototype.slice.call(arguments);
                return new CompletedError(key, message, args);
            };
            obj[key].instanceof = function(err){
                return obj.instanceof(err, obj[key]);
            };
        })(key, error);
    }
};

/**
 * Compile current module
 */
exports.compile(exports);