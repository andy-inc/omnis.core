/**
 * Created by Andy <andy@sumskoy.com> on 27/02/14.
 */

var $glob = require('glob'),
    $q = require('q'),
    $minimatch = require('minimatch'),
    $path = require('path'),
    $express = require('express'),
    $http = require('http'),
    $extend = require('node.extend'),
    $clone = require('clone');

$q.longStackSupport = true;

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
    "annotations": {
        BeforeRoute: BeforeRoute
    },
    "errors": {
        OmnisError: OmnisError,
        HttpError: HttpError,
        Http500Error: Http500Error
    },
    "omnis": {
        extend: $extend,
        clone: $clone
    }
};

var mapSeries = function (arr, iterator) {
    var currentPromise = $q();
    var promises = arr.map(function (el) {
        return currentPromise = currentPromise.then(function () {
            return iterator(el)
        })
    });
    return $q.all(promises)
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
    this._env = process.env.NODE_ENV || "development";
    this._setuped = false;
    this._started = false;

    this._config = {
        debug: false,
        ip: "127.0.0.1",
        port: 3001,
        static: ["./static"],
        views: {
            path: "./views",
            cache: false,
            engine: "ejs"
        },
        cookie: "very secret worlds",
        session: {
            "options": {
                "secret": "very secret worlds"
            },
            "store": {
                "type": "memory",
                "options": {}
            }
        }
    };
};

Application.prototype.config = function(config){
    this._config = $extend(true, this._config, config);
    return this;
};

Application.prototype.paths = function(patterns){
    var args = Array.prototype.slice.call(arguments);
    this._globs = this._globs.concat([args]);
    return this;
};

Application.prototype.setup = function(){
    var self = this;
    var config = this.status().config;

    return $q().then(function(){
        return self._globs.map(self._search.bind(self))
    }).all().then(function(result){
        //### Require all files with selectors
        var module = [];
        result.forEach(function(el){
            module = module.concat(el);
        });
        module.forEach(function(el){
            require($path.join(self._omnis.$root(), el));
        });
    }).then(function(){
        //### Inject all modules
        return self._declareAll();
    }).then(function(){
        //### Calculate annotations
        Object.keys(self._modules).map(function(key){ return self._modules[key]; }).forEach(function(module){
            var _debugInfo = [
                "Module: " + module.$_module.name
            ];
            var annotationInfo = module.$_module.annotations;

            var moduleInfo = {
                annotations: {},
                beforeRoute: [],
                httpMethod: []
            };

            moduleInfo.annotations = annotationInfo["$module"] || {};
            moduleInfo.beforeRoute = Object.keys(moduleInfo.annotations).filter(function(el){
                return moduleInfo.annotations[el] instanceof BeforeRoute;
            });
            moduleInfo.httpMethod = Object.keys(moduleInfo.annotations).filter(function(el){
                return moduleInfo.annotations[el] instanceof HttpMethod;
            });

            for(var methodName in annotationInfo) if (annotationInfo.hasOwnProperty(methodName) && methodName != "$anonymous" && methodName != "$module"){
                var method = module[methodName];
                if (!method) continue;

                _debugInfo.push('\t - ' + methodName);

                var annotations = annotationInfo[methodName];
                var middlewares = [];
                moduleInfo.beforeRoute.forEach(function(name){
                    var bf = moduleInfo.annotations[name];
                    var methodBf = annotations[name];
                    _debugInfo.push('\t\t ' + name + ' ' + JSON.stringify(bf));
                    if (methodBf){
                        _debugInfo.push('\t\t\t child: ' + JSON.stringify(methodBf));
                        bf = bf.module(methodBf);
                    }
                    _debugInfo.push('\t\t\t result: ' + JSON.stringify(bf));
                    middlewares.push(self._getMiddleware(bf.middleware.bind(bf)));
                });
                for(var name in annotations) if (annotations[name] instanceof BeforeRoute && !moduleInfo.annotations[name]){
                    var bf = annotations[name];
                    _debugInfo.push('\t\t ' + name + ' ' + JSON.stringify(bf));
                    middlewares.push(self._getMiddleware(bf.middleware.bind(bf)));
                }

                for(var name in annotations) if (annotations[name] instanceof HttpMethod){
                    var ann = annotations[name];
                    _debugInfo.push('\t\t ' + name + ' ' + JSON.stringify(ann));
                    if (moduleInfo.annotations[name]){
                        _debugInfo.push('\t\t\t parent: ' + JSON.stringify(moduleInfo.annotations[name]));
                        ann = moduleInfo.annotations[name].module(ann);
                    }
                    _debugInfo.push('\t\t\t result: ' + JSON.stringify(ann));

                    var route = ann.getRoute();
                    route.module = module.$_module.name;
                    route.middlewares = [].concat(middlewares).concat(self._getMiddleware(method.bind(module)));
                    self._addRoute(route);
                }
            }
            if (config.debug){
                console.log(_debugInfo.join('\n'));
            }

        });
    }).then(function(){
        //### Init Express.js
        self._express();
    }).then(function(){
        self._setuped = true;
    });
};

Application.prototype.start = function(){
    var self = this;
    var point = this.status();
    var server = this._server = $http.createServer(this._app);
    return $q.ninvoke(server, 'listen', point.port, point.ip).then(function(){
        self._started = true;
    });
};

Application.prototype.stop = function(){
    this._server.close();
    this._started = true;
};

Application.prototype.status = function(){
    var config = this._config;
    return {ip: config.ip, port: config.port, setup: this._setuped, start: this._started, config: config};
};

Application.prototype.module = function(name, filename, fn){
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

Application.prototype.search = function(patterns){
    var args = Array.prototype.slice.call(arguments);
    return this._search(args);
};

Application.prototype.inject = function(fn){
    if (fn == null) throw new Error("Can not inject to function " + fn);
    var allModulesNames = this._toDeclare.map(function(el){ return el.name; }),
        self = this,
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
            return null;
        } else {
            args.push(self._modules[param]);
        }
    }
    return fn.apply(self, args);
};

Application.prototype.plugins = function(plugins){
    var args = Array.prototype.slice.call(arguments),
        self = this;
    return mapSeries(args, function(plugin){
        return self.plugin(plugin);
    })
};

Application.prototype.plugin = function(plugin){
    return this._declare(plugin, true);
};

Application.prototype._getMiddleware = function(fn){
    return function(req, res, next){
        $q.spread([req, res.$res], function(req, $res){
            return fn.call(null, req, $res);
        }).then(function(result){
            if (result != undefined){

                if (typeof result === 'object' && result.$responseType){
                    if (result.$code){
                        res.status(result.$code);
                    }
                    if (result.$responseType === 'html'){
                        res.send(result.$data);
                    } else if (result.$responseType === 'json'){
                        res.json(result.$data);
                    } else if (result.$responseType === 'render'){
                        res.render(result.$template, result.$data);
                    } else {
                        res.send(result.$data);
                    }

                } else if (result === null) {
                    res.send(204, null);
                } else {
                    res.send(result);
                }

            } else {
                next();
            }
        }).fail(function(err){
               next(err);
        })
    };
};

Application.prototype._express = function(){
    var self = this;
    var config = this.status().config;
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
        res._render = res.render.bind(res);

        res.render = function(view, options){
            res.$res.$responseType = 'html';
            if (res.$res.$viewRoot){
                view = $path.join(res.$res.$viewRoot, view);
            }
            res._render(view, options);
        };

        res.$res = {
            $viewRoot: null,
            $responseType: 'html',
            render: function(view, options){
                return {
                    $responseType: "render",
                    $template: view,
                    $data: options
                };
            },

            send: function(code, data){
                if (typeof code !== "number"){
                    return {
                        $responseType: "html",
                        $data: code
                    };
                } else {
                    return {
                        $responseType: "html",
                        $data: data,
                        $code: code
                    };
                }
            },

            json: function(code, data){
                if (typeof code !== "number"){
                    return {
                        $responseType: "json",
                        $data: code
                    };
                } else {
                    return {
                        $responseType: "json",
                        $data: data,
                        $code: code
                    };
                }
            }
        };
        next();
    });

    (config.static || []).forEach(function(el){
        if (el.substr(0, 1) !== '/'){
            el = $path.join(self._omnis.$root(), el);
        }
        app.use($express.static(el));
    });
    app.use($express.methodOverride());
    app.use($express.json());
    app.use($express.urlencoded());

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

    //
    app.use(function(err, req, res, next){
        if (req.xhr || res.$res.$responseType.toLowerCase() === 'json'){
            res.send(err.data.code, err.toJSON())
        } else {
            var data = {
                code: err.data.code,
                error: err.toJSON(),
                env: self._env
            };
            data.error.stack = err.stack;
            var template = err.data.code === 500 ? "500" : "default";
            res._render($path.join(__dirname, "templates", "errors", template), data);
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

Application.prototype._declare = function(module, allowError){
    var self = this;
    var fn = module.fn,
        name = module.name,
        type = module.type;
    return $q.spread([], function(){
        return self.inject(fn);
    }).then(function(result){
        if (!result) {
            if (allowError) throw new Error("Can not resolve dependence for module: " + name);
            return result;
        }
        if (self._toDeclare.indexOf(module) > -1) {
            self._toDeclare.splice(self._toDeclare.indexOf(module), 1);
        }
        if (type == "module"){
            self._modules[name] = result;
            return annotations.get(module.filename).then(function(ans){
                self._modules[name].$_module = {
                    annotations: ans,
                    name: name
                };
                return result;
            })
        } else if (type == "system"){
            _privateModules[name] = result;
        } else if (type === "annotation"){
            annotations.define(name, annotations.$method, result);
        }
        return result;
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

exports.Application = Application;