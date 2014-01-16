/**
 * Created by Andy <andy@sumskoy.com> on 20/12/13.
 */

var $util = require('util'),
    $EventEmitter = require('events').EventEmitter,
    $express = require('express'),
    $url = require('url'),
    $http = require('http'),
    $https = require('https'),
    $path = require('path'),
    $async = require('async');

var utils = require('./utils');

var Core = function(){
    this._root = __dirname;
    this._credentials = {};
    this._controllers = [];
    this._middleware = [];
    this._mode = 'production';
    this._static = $path.join(__dirname, 'static');
    this._session = null;

    this.controller.clear = function(){
        this._controllers = [];
        return this;
    }.bind(this);

    this.session.clear = function(){
        this._session = null;
        return this;
    }.bind(this);

    this.middleware.clear = function(){
        this._middleware = [];
        return this;
    }.bind(this);
};

$util.inherits(Core, $EventEmitter);

/**
 * Register controller
 *
 * Examples:
 *     Core.controller({get: function(req, res, next){
 *          res.send({hello: 'World'});
 *     }});
 *
 * @param {Object} controller
 * @returns {Core}
 */
Core.prototype.controller = function(controller){
    this._controllers.push(controller);
    return this;
};

/**
 * Register middleware
 *
 * Examples:
 *      Core.middleware(function(req, res, next){
 *          next();
 *      });
 *
 * @param {Function} middleware
 * @returns {Core}
 */
Core.prototype.middleware = function(middleware){
    this._middleware.push(middleware);
    return this;
};

/**
 * Setup session manager
 *
 *
 * @param {String} type Type of store. Supports: memory, connect-mongo
 * @param {String} secret
 * @param {Object} cookie Cookie options
 * @param {Object} options Addition options
 * @returns {Core}
 */
Core.prototype.session = function(type, secret, cookie, options){
    var store;
    if (type === 'memory'){
        store = null;
    } else if (type === 'mongodb'){
        store = new (require('connect-mongo')($express))(options);
    } else if (type === 'redis'){
        store = new (require('connect-redis')($express))(options);
    } else {
        throw new Error('Session store type unknown ' + type);
    }
    this._session = $express.session({
        secret: secret,
        store: store,
        cookie: cookie
    });
    return this;
};

/**
 * Init Core instance
 *
 * Examples:
 *      Core.init({
 *          root: __dirname,
 *          credentials: {key: '', cert: ''},
 *          static: __dirname + '/static',
 *          mode: 'debug'
 *      });
 *
 * @param {Object} [options]
 * @returns {Core}
 */
Core.prototype.init = function(options){
    options = options || {};
    this._root = options.root || this._root;
    this._credentials = options.credentials || this._credentials;
    this._static = options.static || this._static;
    this._mode = options.mode || this._mode;

    utils.setMode(this._mode);

    this._app = $express();

    this._app.use($express.methodOverride());
    this._app.use($express.urlencoded());

    this._app.use(function(req, res, next){
        var start = +new Date();
        this.emit('request', req, res);

        if (this._baseUri !== "" && this._baseUri !== "/"){
            utils.debug('replace with base uri: ');
            utils.debug('from: ' + req.url);
            req.url = req.url.substr(this._baseUri.length);
            if (req.url.length === 0 || req.url[0] !== '/'){
                req.url = '/' + req.url;
            }
            utils.debug('to: ' + req.url);
        }

        if (req.url === "/" || (req.url.indexOf("/api") !== 0 && $path.extname(req.url) === "") ){
            req.url = "/index.html";
        } else if (req.url.indexOf("/api") === 0){
            req.isAPI = true;
        }

        res.on('finish', function(){
            res.time = (+new Date()) - start;
            this.emit('response', req, res);
        }.bind(this));

        next();
    }.bind(this));

    this._app.use($express.cookieParser());
    this._app.use($express.json());

    if (this._session != null){
        this._app.use(this._session);
    }

    this._middleware.forEach(function(m){
        this._app.use(m);
    }.bind(this));

    this._app.use(this._app.router);
    this._app.use($express.static(this._static));

    this._controllers.forEach(function(controller){
        var version = controller.version || "v1";
        var route = controller.route;
        if (route.length === 0 || route[0] !== '/'){
            route = '/' + route;
        }

        ['get', 'post', 'put', 'delete'].forEach(function(method){
            if (utils.isFunction(controller[method])){
                var fn = controller[method].bind(controller);
                utils.debug('reg method ' + method + ' route ' + '/api/' + version + route + ' to controller ');
                this._app[method](
                    '/api/' + version + route,
                    function(req, res, next){
                        utils.debug('request in controller: set url');
                        utils.debug('from: ' + req.url);
                        req.url = req.url.substr(('/api/' + version).length);
                        if (req.url.length === 0 || req.url[0] !== '/'){
                            req.url = '/' + req.url;
                        }
                        utils.debug('to: ' + req.url);
                        next();

                    }.bind(this),
                    fn);
            }
        }.bind(this));

    }.bind(this));

    this._app.use(function(req, res, next){
        if (this._controllers.length === 0){
            res.sendfile($path.join(__dirname, 'templates', 'welcome.html'));
        } else {
            res.status(404);
            res.sendfile($path.join(__dirname, 'templates', 'E404.html'));
        }
    }.bind(this));

    this._app.use(function(err, req, res, next){
        this.emit('error', err);
        next(err);
    }.bind(this));

    this._app.use(function(err, req, res, next){
        if (req.isAPI){
            res.send(500, err.message);
        } else {
            res.status(500);
            res.sendfile($path.join(__dirname, 'templates', 'E500.html'));
        }
    });
    return this;
};

/**
 * Start HTTP/HTTPS Server
 *
 * Examples:
 *      Code.start('https://localhost:3001', function(err){
 *          if (err) throw err;
 *      });
 *
 * @param {String} [url]
 * @param {Function} [callback]
 * @returns {Core}
 */
Core.prototype.start = function(url, callback){
    if (utils.isFunction(url)){
        callback = url;
        url = 'http://localhost:3001';
    }
    url = url || 'http://localhost:3001';
    callback = callback || function(){};

    this._server = null;
    var pUrl = $url.parse(url);
    if (pUrl.protocol === 'http:'){
        this._server = $http.createServer(this._app);
    } else if (pUrl.protocol === 'https:'){
        this._server = $https.createServer(this._credentials, this._app);
    } else {
        throw new Error('Unknown protocol - ' + pUrl.protocol);
    }
    this._baseUri = pUrl.path;

    $async.eachSeries(this._controllers, function(controller, next){

        if (utils.isFunction(controller.init)){
            controller.init(this, next);
        } else {
            next();
        }

    }.bind(this), function(err){
        if (err){
            callback(err);
        } else {
            this._server.listen(pUrl.port, pUrl.hostname, function(err){ callback(err); });
        }
    }.bind(this));


    return this;
};

/**
 * Stop HTTP/HTTPS server
 *
 * @returns {Core}
 */
Core.prototype.stop = function(){
    this._server.close();
    return this;
};

exports.Core = new Core();