/**
 * Created by Andy <andy@sumskoy.com> on 27/02/14.
 */

var $glob = require('glob'),
    $q = require('q'),
    $minimatch = require('minimatch'),
    $path = require('path'),
    $express = require('express'),
    $http = require('http');

var annotations = require('../annotations'),
    getParamNames = annotations.getParamNames,
    OmnisError = require('./errors/OmnisError').OmnisError,
    HttpError = require('./errors/HttpError').HttpError,
    Http500Error = require('./errors/HttpError').Http500Error;

var HttpMethod = require('./http/annotations/HttpMethod'),
    BeforeRoute = require('./http/annotations/BeforeRoute'),
    ViewPath = require('./http/annotations/ViewPath');
annotations.define("HttpMethod", annotations.$method, HttpMethod);
annotations.define("ViewPath", annotations.$method, ViewPath);

var _privateModules = {
    "BeforeRoute": BeforeRoute,
    "errors": {
        OmnisError: OmnisError,
        HttpError: HttpError,
        Http500Error: Http500Error
    }
};

var Application = function(name, omnis){
    this.name = name;
    this._omnis = omnis;
    this._globs = [];
    this._toDeclare = [
        require('./modules/constant')
    ];
    this._modules = {};
    this._routes = [];
    this._app = null;
    this._middlewares = [];
    this._errorMiddlewares = [];
    this._env = process.env.NODE_ENV || "development";
};

Application.prototype.paths = function(patterns){
    var args = Array.prototype.slice.call(arguments);
    this._globs = this._globs.concat([args]);
    return this;
};

Application.prototype.setup = function(){
    var self = this;

    return $q.all(this._globs).spread(this._search.bind(this)).then(function(result){
        result.forEach(function(el){
            require($path.join(self._omnis.$root(), el));
        });
    }).then(function(){
        return self._declareAll();
    }).then(function(){
        Object.keys(self._modules).map(function(key){ return self._modules[key]; }).forEach(function(module){
            var annotationInfo = module.$_module.annotations;

            for(var methodName in annotationInfo) if (annotationInfo.hasOwnProperty(methodName)){
                if (!module[methodName]) continue;
                var annotations = Object.keys(annotationInfo[methodName]).map(function(key){ return annotationInfo[methodName][key]; });
                var extMiddleware = [];
                annotations.filter(function(el){ return el instanceof BeforeRoute}).forEach(function(annotation){
                    extMiddleware.push(annotation.getMiddleware());
                });
                annotations.forEach(function(annotation){
                    if (annotation instanceof HttpMethod){
                        var route = annotation.getRoute();
                        route.module = module.$_module.name;
                        route.middlewares = [].concat(extMiddleware).concat(module[methodName]);
                        self._addRoute(route);
                    }
                });
            }

        });
    }).then(function(){
        self._express();
    });
};

Application.prototype.start = function(){
    var point = this.getHttpPoint();
    var server = this._server = $http.createServer(this._app);
    return $q.ninvoke(server, 'listen', point.port, point.ip);
};

Application.prototype.stop = function(){
    this._server.close();
};

Application.prototype.getHttpPoint = function(){
    var config = (this._modules['config'].$omnis || {});
    var ip = config.ip || "127.0.0.0",
        port = config.port || 3001;
    return {ip: ip, port: port};
};

Application.prototype._express = function(){
    var self = this;
    var config = (this._modules['config'].$omnis || {});
    var app = this._app = $express();

    if (config.views){
        if (config.views.path.substr(0, 1) !== '/'){
            config.views.path = $path.join(self._omnis.$root(), config.views.path);
        }
        app.set('views', config.views.path);
        app.set('view cache', config.views.cache);
        app.set('view engine', config.views.engine);
    }

    app.use(function(req, res, next){
        var _render = res.render.bind(res);
        res.$viewRoot = null;
        res.$responseType = 'html';
        res.render = function(view, options){
            res.$responseType = 'html';
            var deferred = $q.defer();
            if (res.$viewRoot){
                view = $path.join(res.$viewRoot, view);
            }
            _render(view, options);
            return deferred.promise;
        };
        next();
    });

    (config.static || []).forEach(function(el){
        if (el.substr(0, 1) !== '/'){
            el = $path.join(self._omnis.$root(), el);
        }
        app.use($express.static(el));
    });
    app.use($express.json());
    app.use($express.urlencoded());
    app.use($express.methodOverride());

    app.use($express.cookieParser(config.cookie));

    //Session config
    var session = config.session,
        type = session.store.type,
        storeOptions = session.store.options,
        store;

    if (type === 'memory'){
        store = new $express.session.MemoryStore(storeOptions);
    } else if (type === 'mongodb'){
        store = new (require('connect-mongo')($express))(storeOptions);
    } else if (type === 'redis'){
        store = new (require('connect-redis')($express))(storeOptions);
    } else if (typeof type === 'function'){
        store = new type(storeOptions)
    } else if (typeof type === 'object'){
        store = type;
    } else {
        throw new Error("Unsupported session store: " + type);
    }

    session = session.options;
    session.store = store;
    app.use($express.session(session));
    //

    //External middleware
    this._middlewares.forEach(function(middleware){
        app.use(middleware);
    });
    //

    app.use(app.router);

    this._routes.forEach(function(route){
        var fn = null;
        if (route.method === "POST") fn = app.post.bind(app);
        else if (route.method === "PUT") fn = app.put.bind(app);
        else if (route.method === "DELETE") fn = app.delete.bind(app);
        else if (route.method === "GET") fn = app.get.bind(app);
        else if (route.method === "ALL") fn = app.all.bind(app);
        if (fn === null) throw new Error("Unsupported method: " + route.method + ", route: " + route.url + " in " + route.module);
        fn(route.url, route.middlewares);
    });

    app.use(function(err, req, res, next){
        if (!(err instanceof OmnisError)) {
            err = new OmnisError("Unknown exception", err);
        }
        if (!(err instanceof HttpError)) {
            err = new Http500Error(err);
        }
        next(err);
    });
    //External error middleware
    this._errorMiddlewares.forEach(function(middleware){
        app.use(middleware);
    });
    //
    app.use(function(err, req, res, next){
        if (req.xhr || res.$responseType.toLowerCase() === 'json'){
            res.send(err.data.code, err.toJSON())
        } else {
            var data = {
                error: err.toJSON(),
                env: self._env
            };
            data.error.stack = err.stack;
            var template = err.data.code === 500 ? "500" : "default";
            res.render($path.join(__dirname, "templates", "errors", template), data);
        }
    });
};

Application.prototype._addRoute = function(route){
    var existRoute = null;
    for(var i = 0; i < this._routes.length; i++){
        if (this._routes[i].url === route.url && this._routes[i].method === route.method){
            existRoute = this._routes[i];
            break;
        }
    }
    if (existRoute == null){
        this._routes.push(route);
    } else {
        existRoute.middlewares = existRoute.middlewares.concat(routes.middlewares);
    }
};

Application.prototype._declareAll = function(){
    var mapSeries = function (arr, iterator) {
        var currentPromise = $q();
        var promises = arr.map(function (el) {
            return currentPromise = currentPromise.then(function () {
                return iterator(el)
            })
        });
        return $q.all(promises)
    };

   var self = this;
   var lastLength = this._toDeclare.length;
   return mapSeries(this._toDeclare, this._declare.bind(this)).then(function(){
       if (self._toDeclare.length > 0) {
           if (self._toDeclare.length === lastLength){
               throw new Error("Circle dependence in: " + self._toDeclare.map(function(el){ return el.name; }));
           } else {
               lastLength = self._toDeclare.length;
               return self._declareAll();
           }
       }  else {
           return true;
       }
   });
};

Application.prototype._declare = function(module){
    var allModulesNames = this._toDeclare.map(function(el){ return el.name; });
    var self = this;
    var fn = module.fn,
        name = module.name,
        type = module.type,
        params;
    if (Array.isArray(fn)){
        params = [].concat(fn);
        fn = params.pop();
    } else {
        params = getParamNames(fn);
    }
    var args = [];
    for(var i = 0; i < params.length; i++){
        var param = params[i];
        if (param.substr(0, 1) === "$"){
            param = param.substr(1);
            if (_privateModules[param]){
                args.push(_privateModules[param]);
            } else {
                args.push(require(param));
            }
            continue;
        }
        if (!self._modules[param]){
            if (allModulesNames.indexOf(param) == -1){
                throw new Error("Unknown dependence: " + param + " in " + name);
            }
            return false;
        } else {
            args.push(self._modules[param]);
        }
    }
    return $q.spread([], function(){
        return fn.apply(self, args);
    }).then(function(result){
        self._toDeclare.splice(self._toDeclare.indexOf(module), 1);
        if (type != "system"){
            self._modules[name] = result;
            return annotations.get(module.filename).then(function(ans){
                self._modules[name].$_module = {
                    annotations: ans,
                    name: name
                };
                return result;
            })
        } else {
            return result;
        }
    }).then(function(result){
        if (type == "system"){
            _privateModules[name] = result;
        }
    }).then(function(){
        if (type === "annotation"){
            annotations.define(name, annotations.$method, self._modules[name]);
        }
    });
};

Application.prototype._search = function(patterns){
    var globPattern = patterns.shift();
    return $q.nfcall($glob, globPattern, {root: this._omnis.$root(), cwd: this._omnis.$root()})
        .then(function(result){
            patterns.forEach(function(pattern){
                result = result.filter($minimatch.filter(pattern));
            });
            return result;
        });
};

Application.prototype.declare = function(name, filename, fn){
    this._toDeclare.push({
        name: name,
        filename: filename,
        fn: fn,
        type: "module"
    });
};

Application.prototype.annotation = function(name, filename, fn){
    this._toDeclare.push({
        name: name,
        filename: filename,
        fn: fn,
        type: "annotation"
    });
};

Application.prototype.addMiddleware = function(fn){
    this._middlewares = this._middlewares.concat(fn);
};

Application.prototype.addErrorMiddleware = function(fn){
    this._errorMiddlewares = this._errorMiddlewares.concat(fn);
};

Application.prototype.findFiles = function(patterns){
    var args = Array.prototype.slice.call(arguments);
    return this._search(args);
};

exports.Application = Application;