/**
 * Created by Andy <andy@sumskoy.com> on 20/12/13.
 */

var should = require('should');
var assert = require('assert');
var request = require('supertest');
var fs = require('fs');

var Core = require('../index').Core;
var SimpleController = require('../examples/controllers/simple');
var SimpleControllerAsObject = require('../examples/controllers/simple_object');
var SessionController = require('../examples/controllers/session');

describe('Core', function(){
    var url = 'http://localhost:3001';
    describe('#start default', function(){
        it('should create server with 200 on start', function(done){
            Core.controller.clear();
            Core.init({root: __dirname + "/../", mode: 'test'});
            Core.start(url, function(err){
                if (err) throw err;
                request(url)
                    .get('/')
                    .expect(200, fs.readFileSync(__dirname + '/../lib/templates/welcome.html').toString())
                    .end(function(err){
                        Core.stop();
                        done(err);
                    });
            });
        });
        it('should start server with route', function(done){
            Core.controller.clear();
            Core.controller(SimpleController);
            Core.init({root: __dirname + "/../", mode: 'test'});
            Core.start(url, function(err){
                if (err) throw err;
                request(url)
                    .get('/api/v1/simple')
                    .expect(200, '{\n  "hello": "World"\n}')
                    .end(function(err){
                        Core.stop();
                        done(err);
                    });
            });
        });

        it('should start server with route and after init', function(done){
            Core.controller.clear();
            Core.controller(SimpleController);
            Core.init({root: __dirname + "/../", mode: 'test'});
            Core.start(url, function(err){
                if (err) throw err;
                request(url)
                    .del('/api/v1/simple')
                    .expect(200, '{\n  "hello": "TEST"\n}')
                    .end(function(err){
                        Core.stop();
                        done(err);
                    });
            });
        });

        it('should start server with route as object and after init', function(done){
            Core.controller.clear();
            Core.controller(SimpleControllerAsObject);
            Core.init({root: __dirname + "/../", mode: 'test'});
            Core.start(url, function(err){
                if (err) throw err;
                request(url)
                    .del('/api/v1/simple_object')
                    .expect(200, '{\n  "hello": "TEST"\n}')
                    .end(function(err){
                        Core.stop();
                        done(err);
                    });
            });
        });

        it('should wrap error', function(done){
            Core.controller.clear();
            Core.controller(SimpleControllerAsObject);
            Core.init({root: __dirname + "/../", mode: 'test'});
            Core.on('error', function(err){});
            Core.start(url, function(err){
                if (err) throw err;
                request(url)
                    .post('/api/v1/simple_object')
                    .send({})
                    .expect(500, '{"error":"error"}')
                    .end(function(err){
                        Core.stop();
                        done(err);
                    });
            });
        });

        it('should be 404 on wrong route with controllers', function(done){
            Core.controller.clear();
            Core.controller(SimpleControllerAsObject);
            Core.init({root: __dirname + "/../", mode: 'test'});
            Core.start(url, function(err){
                if (err) throw err;
                request(url)
                    .get('/wrong/path')
                    .expect(404, fs.readFileSync(__dirname + '/../lib/templates/E404.html').toString())
                    .end(function(err){
                        Core.stop();
                        done(err);
                    });
            });
        });
    });

    describe('#start session', function(){
        it('should save session and get back', function(done){
            Core.controller.clear();
            Core.controller(SessionController);
            Core.session('monogodb','fewfaweffawef', {}, {uri: 'mongodb://localhost/test'});
            Core.init({root: __dirname + "/../", mode: 'test'});
            Core.start(url, function(err){
                if (err) throw err;
                request(url)
                    .post('/api/v1/session')
                    .send({name: "test"})
                    .end(function(err, res){
                        if (err){
                            done(err);
                        } else {
                            request(url)
                                .get('/api/v1/session')
                                .set('cookie', res.headers['set-cookie'])
                                .expect(200, '{\n  "name": "test"\n}')
                                .end(function(err){
                                    Core.stop();
                                    done(err);
                                });
                        }
                    });
            });
        });

    });

});

