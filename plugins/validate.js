/**
 * Created by Andy <andy@sumskoy.com> on 21/12/13.
 */

var util = require('util');

/**
 * Init validate plugin
 * @param {Object} options
 *
 * Examples:
 *  validate({
 *      env: environment: JSV.createEnvironment(),
 *      defaultError: function(err, req, res, next){
 *          next(err);
 *      }
 *  });
 *
 * @returns {Object}
 */
module.exports = exports = function(options){
    return new Validate(options);
};

var _errors = [ 'ValidateSchemaNotFound' ];

function AbstractError(msg, constr) {
    Error.captureStackTrace(this, constr || this);
    this.message = msg || 'Error';
}
util.inherits(AbstractError, Error);
AbstractError.prototype.name = 'Abstract Error';

var errors = {};
_errors.forEach(function (errorName) {
    var errorFn = function (msg) {
        errorFn.super_.call(this, msg, this.constructor);
    };
    util.inherits(errorFn, AbstractError);
    errorFn.prototype.name = errorName;
    errors[errorName] = errorFn;
});

/**
 * Validate plugin constructor
 *
 * @param {Object} options
 * @constructor
 */
var Validate = function(options){
    this.env = options.environment;
    this.defaultError = options.defaultError || this._error;
    this.hooks = {
        'before-route': this._beforeRoute.bind(this),
        'after-route': this._afterRoute.bind(this)
    };
};

/**
 * Default validate middleware
 * @param err
 * @param req
 * @param res
 * @param next
 * @private
 */
Validate.prototype._error = function(err, req, res, next){
    next(err);
};

/**
 * Hook: before route
 * @param controller
 * @param method
 * @returns {Function}
 * @private
 */
Validate.prototype._beforeRoute = function(controller, method){
    var settings = ((controller.plugins || {}).validate || {})[method] || null;
    if (settings == null){
        return function(req, res, next) { next(); }
    }
    if (typeof settings === 'string'){
        settings = {model: settings, error: this.defaultError};
    }
    return function(req, res, next){
        var validateResult;
        if (typeof settings.model === 'string') {
            var keySchema = this.env.findSchema(settings.model);
            if (keySchema == null){
                next(new errors.ValidateSchemaNotFound("Model not found: " + settings.model));
                return;
            }
            validateResult = keySchema.validate(req.body);
        } else {
            validateResult = this.env.validate(req.body, settings.model);
        }

        if (validateResult.errors.length > 0){
            next(validateResult);
            return;
        }
        next();
    }.bind(this);
};

/**
 * Hook: after route
 * @param controller
 * @param method
 * @returns {Function}
 * @private
 */
Validate.prototype._afterRoute  = function(controller, method){
    var settings = ((controller.plugins || {}).validate || {})[method] || null;
    if (settings == null || settings.error == null){
        return this.defaultError;
    }
    if (typeof settings === 'string'){
        settings = {model: settings, error: this.defaultError};
    }
    return settings.error.bind(controller);
};