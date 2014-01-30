omnis.core
==========

Web framework for fast creating restful api with rich web application client. All api routes was in `/api/#{vesrion}/#{route}/#{sub route}`

Install
```
npm install omnis.core
```

Usage
----

```javascript
var Core = require("omnis.core").Core;
Core.init({root: __dirname});
Core.on('error', function(err){
    console.error(err);
});
Core.start("http://localhost:3001", function(err){
    if (err) throw err;
});
```

Create controller
----

For example create controller for `/api/v1/simple`
```javascript
var initData;

module.exports = exports = {
    version: 'v1',   //api version
    route: '/simple',//api route

    //on get method
    get: function(req, res, next){
        res.send({hello: initData});
    },

    //on post method
    post: function(req, res, next){
        var err = new Error(JSON.stringify({error: 'error'}));
        next(err);
    },

    //on init controller
    init: function(omnis, callback){
        initData = "TEST";
        callback();
    }
};
```

create controller for `/api/v1/simple` with sub path like `/api/v1/simple/:id/view`
```javascript
module.exports = exports = {
    version: 'v1',   //api version
    route: '/simple',//api route

    //on get method
    get: function(req, res, next){
        res.send({hello: initData});
    },
    
    //on get in sub path with param
    "get-/:id/view": function(req, res, next){
        res.send({hello: req.param("id")});
    }
};
```

Add session support
----

Session may be `memory`, `mongodb`, `redis`
For `mongodb` you must install module `connect-mongo`
For `redis` install `connect-redis`

```javascript
var Core = require("omnis.core").Core;
Core.session('mongodb', 'secret_key', {options1: true}, {url: 'mongodb://localhost/test'});
Core.init({root: __dirname});
Core.on('error', function(err){
    console.error(err);
});
Core.start("http://localhost:3001", function(err){
    if (err) throw err;
});
```
