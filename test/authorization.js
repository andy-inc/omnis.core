/**
 * Created by andy <andy.sumskoy@gmail.com> on 16/01/14.
 */

var should = require('should');
var assert = require('assert');
var request = require('supertest');
var fs = require('fs');
var JSV = require('JSV').JSV;
var errors = require('../lib/errors');

var Core = require('../index').Core;
var AuthController = require('../examples/controllers/auth');
var auth = require('../plugins/authorization')();

auth.addRule('default', function(controller, url, method, session, req, callback){
    if (req.body.auth){
        callback();
    } else {
        callback(new errors.OmnisAuthorizationUnauthorized());
    }
});

describe('Core', function(){
    var url = 'http://localhost:3001';

    describe("#plugins", function(){
        it('authorization no auth', function(done){
            Core.controller.clear();
            Core.controller(AuthController);
            Core.plugin.clear();
            Core.plugin(auth);
            Core.session('memory','fewfaweffawef', {});
            Core.init({root: __dirname + "/../", mode: 'test'});
            Core.start(url, function(err){
                if (err) throw err;
                request(url)
                    .post('/api/v1/auth')
                    .send({})
                    .expect(401, '{\n  "code": "OmnisAuthorizationUnauthorized",\n  "message": "Omnis.Authorization: Unauthorized",\n  "exception": "[]"\n}')
                    .end(function(err){
                        Core.stop();
                        done(err);
                    });
            });
        });
        it('authorization no auth with default', function(done){
            Core.controller.clear();
            Core.controller(AuthController);
            Core.plugin.clear();
            Core.plugin(auth);
            Core.session('memory','fewfaweffawef', {});
            Core.init({root: __dirname + "/../", mode: 'test'});
            Core.start(url, function(err){
                if (err) throw err;
                request(url)
                    .put('/api/v1/auth')
                    .send({})
                    .expect(403, '{\n  "code": "OmnisAuthorizationAccessDenied",\n  "message": "Omnis.Authorization: Access Denied",\n  "exception": "[]"\n}')
                    .end(function(err){
                        Core.stop();
                        done(err);
                    });
            });
        });
        it('authorization auth and success', function(done){
            Core.controller.clear();
            Core.controller(AuthController);
            Core.plugin.clear();
            Core.plugin(auth);
            Core.session('memory','fewfaweffawef', {});
            Core.init({root: __dirname + "/../", mode: 'test'});
            Core.start(url, function(err){
                if (err) throw err;
                request(url)
                    .get('/api/v1/auth')
                    .expect(200, 'success')
                    .end(function(err, res){
                        if (err){
                            Core.stop();
                            done(err);
                        } else {
                            request(url)
                                .put('/api/v1/auth')
                                .set('cookie', res.headers['set-cookie'])
                                .send({})
                                .expect(200, '{}')
                                .end(function(err){
                                    Core.stop();
                                    done(err);
                                });
                        }
                    });
            });
        });
        it('authorization auth and success - logout and access', function(done){
            Core.controller.clear();
            Core.controller(AuthController);
            Core.plugin.clear();
            Core.plugin(auth);
            Core.session('memory','fewfaweffawef', {});
            Core.init({root: __dirname + "/../", mode: 'test'});
            Core.start(url, function(err){
                if (err) throw err;
                request(url)
                    .get('/api/v1/auth')
                    .expect(200, 'success')
                    .end(function(err, res){
                        if (err){
                            Core.stop();
                            done(err);
                        } else {
                            request(url)
                                .put('/api/v1/auth')
                                .set('cookie', res.headers['set-cookie'])
                                .send({})
                                .expect(200, '{}')
                                .end(function(err){
                                    if (err){
                                        Core.stop();
                                        done(err);
                                    } else {
                                        request(url)
                                            .del('/api/v1/auth')
                                            .set('cookie', res.headers['set-cookie'])
                                            .expect(200, 'success')
                                            .end(function(err, res){
                                                if (err){
                                                    Core.stop();
                                                    done(err);
                                                } else {
                                                    request(url)
                                                        .put('/api/v1/auth')
                                                        .set('cookie', res.headers['set-cookie'])
                                                        .send({})
                                                        .expect(403, '{\n  "code": "OmnisAuthorizationAccessDenied",\n  "message": "Omnis.Authorization: Access Denied",\n  "exception": "[]"\n}')
                                                        .end(function(err){
                                                            Core.stop();
                                                            done(err);
                                                        });
                                                }
                                            });
                                    }
                                });
                        }
                    });
            });
        });
        it('authorization auth custom', function(done){
            Core.controller.clear();
            Core.controller(AuthController);
            Core.plugin.clear();
            Core.plugin(auth);
            Core.session('memory','fewfaweffawef', {});
            Core.init({root: __dirname + "/../", mode: 'test'});
            Core.start(url, function(err){
                if (err) throw err;
                request(url)
                    .post('/api/v1/auth')
                    .send({auth: true})
                    .expect(200, '{\n  "auth": true\n}')
                    .end(function(err){
                        Core.stop();
                        done(err);
                    });
            });
        });
        it('authorization dany default', function(done){
            var authDeny = require('../plugins/authorization')({allowByDefault: false});

            authDeny.addRule('default', function(controller, url, method, session, req, callback){
                if (req.body.auth){
                    callback();
                } else {
                    callback(new errors.OmnisAuthorizationUnauthorized());
                }
            });
            Core.controller.clear();
            Core.controller(AuthController);
            Core.plugin.clear();
            Core.plugin(authDeny);
            Core.session('memory','fewfaweffawef', {});
            Core.init({root: __dirname + "/../", mode: 'test'});
            Core.start(url, function(err){
                if (err) throw err;
                request(url)
                    .get('/api/v1/auth')
                    .send({auth: true})
                    .expect(403, '{\n  "code": "OmnisAuthorizationNoRuleForMethod",\n  "message": "Omnis.Authorization: no rule for method",\n  "exception": "[]"\n}')
                    .end(function(err){
                        Core.stop();
                        done(err);
                    });
            });
        });
    });

});


