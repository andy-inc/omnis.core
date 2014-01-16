/**
 * Created by andy <andy.sumskoy@gmail.com> on 16/01/14.
 */

var errors = require('../lib/errors'),
    utils = require('../lib/utils');

module.exports = exports = function(options){
    return new Authorization(options || {});
};

var Authorization = function(options){
    this.rules = options.rules || {};
    this.defaultError = options.defaultError || this._error;
    this.allowByDefault = true;
    if (options.allowByDefault != null) this.allowByDefault = options.allowByDefault;
    this.hooks = {
        'before-route': this._beforeRoute.bind(this),
        'after-route': this._afterRoute.bind(this)
    };
};

/**
 * Add rule
 *
 * Examples:
 *  auth.addRule('default', function(controller, url, method, session, req, callback){
 *      if (session == null){
 *          callback(new errors.OmnisAuthorizationAccessDenied());
 *      } else {
 *          callback();
 *      }
 *  });
 *
 *  auth.addRule('default', function(controller, url, method, session, callback){
 *      if (session == null){
 *          callback(new errors.OmnisAuthorizationAccessDenied());
 *      } else {
 *          callback();
 *      }
 *  });
 *
 *  auth.addRule('default', function(url, method, session, callback){
 *      if (session == null){
 *          callback(new errors.OmnisAuthorizationAccessDenied());
 *      } else {
 *          callback();
 *      }
 *  });
 *
 *  auth.addRule('default', function(session, callback){
 *      if (session == null){
 *          callback(new errors.OmnisAuthorizationAccessDenied());
 *      } else {
 *          callback();
 *      }
 *  });
 *
 * @param {String} name
 * @param {Function} rule
 * @returns {Authorization}
 */
Authorization.prototype.addRule = function(name, rule){
    this.rules[name] = rule;
    return this;
};

/**
 * Default authorization error middleware
 * @param err
 * @param req
 * @param res
 * @param next
 * @private
 */
Authorization.prototype._error = function(err, req, res, next){
    if (errors.instanceof(err, errors.OmnisAuthorizationAccessDenied)){
        res.send(403, err.toJSON());
    } else if (errors.instanceof(err, errors.OmnisAuthorizationUnauthorized)){
        res.send(401, err.toJSON());
    } else if (errors.instanceof(err, errors.OmnisAuthorizationNoRuleForMethod)){
        res.send(403, err.toJSON());
    } else {
        next(err);
    }
};

/**
 * Hook before route
 * @param controller
 * @param method
 * @returns {Function}
 * @private
 */
Authorization.prototype._beforeRoute = function(controller, method){
    var settings = ((controller.plugins || {}).authorization || {})[method] || null,
        ruleName = "custom";
    if (settings == null && this.allowByDefault){
        return function(req, res, next) {  next(); }
    } else if (settings == null && !this.allowByDefault){
        return function(req, res, next) {  next(new errors.OmnisAuthorizationNoRuleForMethod()); }
    }
    if (typeof settings === 'string'){
        ruleName = settings;
        settings = this.rules[settings];
    }
    return function(req, res, next){
        if (!utils.isFunction(settings)){
            next(new errors.OmnisAuthorizationRuleNotFound(ruleName));
            return;
        }
        var params = getParamNames(settings);
        if (params.length === 6) settings(controller, req.url, method, req.session, req, next);
        else if (params.length === 5) settings(controller, req.url, method, req.session, next);
        else if (params.length === 4) settings(req.url, method, req.session, next);
        else if (params.length === 2) settings(req.session, next);
        else next(new errors.OmnisAuthorizationRuleNotFound(ruleName));
    }.bind(this);
};

/**
 * Hook after route
 * @param controller
 * @param method
 * @returns {Function}
 * @private
 */
Authorization.prototype._afterRoute = function(controller, method){
    return this.defaultError;
};

/**
 * Parse params from function declaration
 * @param {Function} fn
 * @returns {Array}
 */
var getParamNames = function (fn) {
    var funStr = fn.toString();
    return funStr.slice(funStr.indexOf('(') + 1, funStr.indexOf(')')).match(/([^\s,]+)/g);
};