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
    $ejs = require('ejs');

$q.longStackSupport = true;

var annotations = require('../annotations'),
    OmnisError = require('./errors/OmnisError').OmnisError,
    HttpError = require('./errors/HttpError').HttpError,
    Http500Error = require('./errors/HttpError').Http500Error,
    DI = require('./di').DI,
    Response = require('./response').Response;

var HttpMethod = require('./http/annotations/HttpMethod'),
    BeforeRoute = require('./http/annotations/BeforeRoute'),
    AfterRoute = require('./http/annotations/AfterRoute'),
    ViewPath = require('./http/annotations/ViewPath');
annotations.define("HttpMethod", annotations.$method, HttpMethod);
annotations.define("ViewPath", annotations.$method, ViewPath);

var Application = function(name, omnis){
    this.name = name;
    this._omnis = omnis;
    this._globs = [];
    this._di = new DI({});
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

    var self = this;
    $glob.sync('**/*.js', {cwd: $path.join(__dirname, 'modules') }).forEach(function(el){
        self._di.register(require($path.join(__dirname, 'modules', el)));
    });
};

Application.prototype.config = function(config){
    this._config = $extend(true, this._config, config);
    this._di.setDebug(config.debug);
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
            require(el);
        });
    }).then(function(){
        //### Inject all modules
        return self._di.init();
    }).then(function(){
        //### Calculate annotations
        self._di.getAllModulesName().map(function(el){ return self._di.getModule(el); }).forEach(function(module){
            if (!module.$_module) return;
            var _debugInfo = [
                "Module: " + module.$_module.name
            ];
            var annotationInfo = module.$_module.annotations;

            var moduleInfo = {
                annotations: {},
                beforeRoute: [],
                afterRoute: [],
                httpMethod: []
            };

            moduleInfo.annotations = annotationInfo["$module"] || {};
            moduleInfo.beforeRoute = Object.keys(moduleInfo.annotations).filter(function(el){
                return moduleInfo.annotations[el] instanceof BeforeRoute;
            });
            moduleInfo.afterRoute = Object.keys(moduleInfo.annotations).filter(function(el){
                return moduleInfo.annotations[el] instanceof AfterRoute;
            });
            moduleInfo.httpMethod = Object.keys(moduleInfo.annotations).filter(function(el){
                return moduleInfo.annotations[el] instanceof HttpMethod;
            });

            for(var methodName in annotationInfo) if (annotationInfo.hasOwnProperty(methodName) && methodName != "$anonymous" && methodName != "$module"){
                var method = module[methodName];
                if (!method) continue;

                _debugInfo.push('\t - ' + methodName);

                var annotations = annotationInfo[methodName];
                var middlewares = [], alterRouteMiddlewares = [];
                //Before Route
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

                //After Route
                moduleInfo.afterRoute.forEach(function(name){
                    var bf = moduleInfo.annotations[name];
                    var methodBf = annotations[name];
                    _debugInfo.push('\t\t ' + name + ' ' + JSON.stringify(bf));
                    if (methodBf){
                        _debugInfo.push('\t\t\t child: ' + JSON.stringify(methodBf));
                        bf = bf.module(methodBf);
                    }
                    _debugInfo.push('\t\t\t result: ' + JSON.stringify(bf));
                    alterRouteMiddlewares.push(self._getErrorMiddleware(bf.middleware.bind(bf)));
                });
                for(var name in annotations) if (annotations[name] instanceof AfterRoute && !moduleInfo.annotations[name]){
                    var bf = annotations[name];
                    _debugInfo.push('\t\t ' + name + ' ' + JSON.stringify(bf));
                    alterRouteMiddlewares.push(self._getErrorMiddleware(bf.middleware.bind(bf)));
                }

                //Route
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
                    route.middlewares = [].concat(middlewares).concat(self._getMiddleware(method.bind(module))).concat(alterRouteMiddlewares);
                    _debugInfo.push('\t\t\t route: ' + JSON.stringify(route));
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

Application.prototype.module  =
Application.prototype.declare =
Application.prototype.define  = function(namespace, name, filename, fn){
    if (arguments.length === 3){
        fn = filename;
        filename = name;
        name = namespace;
        namespace = null;
    }
    this._di.register({
        name: name,
        filename: filename,
        fn: fn,
        type: "module",
        ns: namespace
    });
};

Application.prototype.annotation = function(namespace, name, filename, fn){
    if (arguments.length === 3){
        fn = filename;
        filename = name;
        name = namespace;
        namespace = null;
    }
    this._di.register({
        name: name,
        filename: filename,
        fn: fn,
        type: "annotation",
        ns: namespace
    });
};

Application.prototype.search = function(patterns){
    var args = Array.prototype.slice.call(arguments);
    return this._search(args);
};

Application.prototype.inject = function(ns, fn){
    if (arguments.length == 1){
        fn = ns;
        ns = null;
    }
    return this._di.inject(ns, null, fs);
};

Application.prototype.plugins = function(plugins){
    var args = Array.prototype.slice.call(arguments),
        self = this;
    return this.mapSeries(args, function(plugin){
        return self.plugin(plugin);
    })
};

Application.prototype.plugin = function(plugin){
    return this._di.register(plugin);
};

Application.prototype._getMiddleware = function(fn){
    return function(req, res, next){
        $q.spread([req, res.$res], function(req, $res){
            return fn.call(null, req, $res);
        }).then(function(result){
            if (result != undefined){
                res.$res.$send(result);
            } else {
                next();
            }
        }).fail(function(err){
               next(err);
        })
    };
};

Application.prototype._getErrorMiddleware = function(fn){
    return function(err, req, res, next){
        $q.spread([err, req, res.$res], function(err, req, $res){
            return fn.call(null, err, req, $res);
        }).then(function(result){
            if (result != undefined){
                res.$res.$send(result);
            } else {
                next(err);
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

        res.$res = new Response(res);
        res.render = function(view, options){
            res.$res.$responseType = 'html';
            if (res.$res.$viewRoot){
                view = $path.join(res.$res.$viewRoot, view);
            }
            res._render(view, options);
        };
        next();
    });

    self._addMiddleware('middleware:before:all');

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

    self._addMiddleware('middleware:before:router');

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

    self._addMiddleware('middleware:after:router');
    self._addMiddleware('middleware:before:error');

    app.use(function(err, req, res, next){
        if (!(err instanceof OmnisError)) {
            err = new OmnisError("Unknown exception", err);
        }
        if (!(err instanceof HttpError)) {
            err = new Http500Error(err);
        }
        next(err);
    });

    self._addMiddleware('middleware:before:error');

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
            $ejs.renderFile($path.join(__dirname, "templates", "errors", template + '.ejs'), data, function(err, data){
                if (err){
                    next(err);
                } else {
                    res.send(data);
                }
            });
        }
    });

    self._addMiddleware('middleware:after:all');

    app.use(function(req, res, next){
        if (req.xhr || res.$res.$responseType.toLowerCase() === 'json'){
            res.send(404, "Not found")
        } else {
            var data = {
                code: 404
            };
            $ejs.renderFile($path.join(__dirname, "templates", "errors", "default.ejs"), data, function(err, data){
                if (err){
                    next(err);
                } else {
                    res.send(data);
                }
            });
        }
    });
};

Application.prototype._addMiddleware = function(type){
    var self = this;
    self._di.getAllModulesName().map(function(el){
        return self._di.getModule(el);
    }).filter(function(module){
        return module.$_module && module.$_module.type === type;
    }).forEach(function(module) {
        if (module.length === 2){
            self._app.use(self._getMiddleware(module))
        } else {
            self._app.use(self._getErrorMiddleware(module));
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


Application.prototype._search = function(patterns){
    var self = this;
    var globPattern = patterns.shift();
    return $q.nfcall($glob, globPattern, {root: this._omnis.$root(), cwd: this._omnis.$root()})
        .then(function(result){
            patterns.forEach(function(pattern){
                result = result.filter($minimatch.filter(pattern));
            });
            result = result.map(function(el){
                return $path.join(self._omnis.$root(), el)
            });
            return result;
        });
};

Application.prototype.mapSeries = function (arr, iterator) {
    var currentPromise = $q();
    var promises = arr.map(function (el) {
        return currentPromise = currentPromise.then(function () {
            return iterator(el)
        })
    });
    return $q.all(promises)
};

exports.Application = Application;