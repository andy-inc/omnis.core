/**
 * Created by Andy <andy@sumskoy.com> on 20/12/13.
 */
var initData = null;

module.exports = exports = {
    version: 'v1',
    route: '/simple_object',


    get: function(req, res, next){
        res.send({hello: 'World'});
    },

    delete: function(req, res, next){
        res.send({hello: initData});
    },

    post: function(req, res, next){
        var err = new Error(JSON.stringify({error: 'error'}));
        next(err);
    },

    init: function(omnis, callback){
        initData = "TEST";
        callback();
    }
};