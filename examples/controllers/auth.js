/**
 * Created by Andy <andy@sumskoy.com> on 20/12/13.
 */

var errors = require('../../lib/errors');

var AuthController = function(){
    this.version = 'v1';
    this.route = '/auth';
    this.plugins = {
        authorization: {
            post: "default",
            put: function(session, callback){
                if (session.user == null){
                    callback(new errors.OmnisAuthorizationAccessDenied());
                } else {
                    callback();
               }
            }
        }
    };
};

AuthController.prototype.get = function(req, res, next){
    req.session.user = 1;
    res.send('success');
};

AuthController.prototype.post = function(req, res, next){
    res.send(req.body);
};

AuthController.prototype.put = function(req, res, next){
    res.send(req.body);
};

AuthController.prototype.delete = function(req, res, next){
    delete req.session.user;
    res.send('success');
};

module.exports = exports = new AuthController();