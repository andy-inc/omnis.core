/**
 * Created by andy <andy.sumskoy@gmail.com> on 16/01/14.
 */

var should = require('should');
var assert = require('assert');
var request = require('supertest');
var fs = require('fs');
var JSV = require('JSV').JSV;

var Core = require('../index').Core;
var SimpleController = require('../examples/controllers/simple');
var SimpleControllerAsObject = require('../examples/controllers/simple_object');
var SessionController = require('../examples/controllers/session');
var ValidateController = require('../examples/controllers/validate');
var ValidateExController = require('../examples/controllers/validate_ex');

describe('Core', function(){
    var url = 'http://localhost:3001';

    describe("#plugins", function(){
        it('validate with default error', function(done){
            Core.controller.clear();
            Core.controller(ValidateController);
            Core.plugin.clear();
            Core.plugin(require('../plugins/validate')({environment: JSV.env}));
            Core.init({root: __dirname + "/../", mode: 'test'});
            Core.start(url, function(err){
                if (err) throw err;
                request(url)
                    .post('/api/v1/validate')
                    .send({})
                    .expect(400, '{\n  "code": "OmnisValidationFailed",\n  "message": "Omnis.Validation: validation failed, model: validate:post#",\n  "exception": [\n    {\n      "schemaUri": "validate:post#/properties/code",\n      "attribute": "required",\n      "message": "Property is required",\n      "details": true\n    }\n  ]\n}')
                    .end(function(err){
                        Core.stop();
                        done(err);
                    });
            });
        });
        it('validate with default custom', function(done){
            Core.controller.clear();
            Core.controller(ValidateController);
            Core.plugin.clear();
            Core.plugin(require('../plugins/validate')({environment: JSV.env}));
            Core.init({root: __dirname + "/../", mode: 'test'});
            Core.start(url, function(err){
                if (err) throw err;
                request(url)
                    .put('/api/v1/validate')
                    .send({})
                    .expect(400, 'ERROR: Property is required')
                    .end(function(err){
                        Core.stop();
                        done(err);
                    });
            });
        });

        it('validate with custom default error', function(done){
            Core.controller.clear();
            Core.controller(ValidateController);
            Core.plugin.clear();
            Core.plugin(require('../plugins/validate')({environment: JSV.env, defaultError: function(err, req, res, next){
                res.send(500, "ERROR");
            }}));
            Core.init({root: __dirname + "/../", mode: 'test'});
            Core.start(url, function(err){
                if (err) throw err;
                request(url)
                    .post('/api/v1/validate')
                    .send({})
                    .expect(500, 'ERROR')
                    .end(function(err){
                        Core.stop();
                        done(err);
                    });
            });
        });

        it('validate with success', function(done){
            Core.controller.clear();
            Core.controller(ValidateController);
            Core.plugin.clear();
            Core.plugin(require('../plugins/validate')({environment: JSV.env}));
            Core.init({root: __dirname + "/../", mode: 'test'});
            Core.start(url, function(err){
                if (err) throw err;
                request(url)
                    .put('/api/v1/validate')
                    .send({code: "test"})
                    .expect(200, '{\n  "code": "test"\n}')
                    .end(function(err){
                        if (err) { done(err); Core.stop(); return; }

                        request(url)
                            .post('/api/v1/validate')
                            .send({code: "test"})
                            .expect(200, '{\n  "code": "test"\n}')
                            .end(function(err){
                                Core.stop();
                                done(err);
                            });
                    });
            });
        });

        it('validate ex with success', function(done){
            Core.controller.clear();
            Core.controller(ValidateExController);
            Core.plugin.clear();
            Core.plugin(require('../plugins/validate')({environment: JSV.env}));
            Core.init({root: __dirname + "/../", mode: 'test'});
            Core.start(url, function(err){
                if (err) throw err;
                request(url)
                    .put('/api/v1/validate_ex')
                    .send({code: "test"})
                    .expect(500, 'Omnis.Validation: model not found: not:found#')
                    .end(function(err){
                        if (err) { done(err); Core.stop(); return; }
                        request(url)
                            .post('/api/v1/validate_ex')
                            .send({code_ex: "test"})
                            .expect(200, '{\n  "code_ex": "test"\n}')
                            .end(function(err){
                                Core.stop();
                                done(err);
                            });
                    });
            });
        });

        it('validate with custom scheme', function(done){
            Core.controller.clear();
            Core.controller(ValidateExController);
            Core.plugin.clear();
            Core.plugin(require('../plugins/validate')({environment: JSV.env}));
            Core.init({root: __dirname + "/../", mode: 'test'});
            Core.start(url, function(err){
                if (err) throw err;
                request(url)
                    .post('/api/v1/validate_ex')
                    .send({code: "test"})
                    .expect(400,  '{\n  "code": "OmnisValidationFailed",\n  "message": "Omnis.Validation: validation failed, model: custom",\n  "exception": [\n    {\n      "attribute": "additionalProperties",\n      "message": "Additional properties are not allowed",\n      "details": false\n    },\n    {\n      "attribute": "required",\n      "message": "Property is required",\n      "details": true\n    }\n  ]\n}')
                    .end(function(err){
                        Core.stop();
                        done(err);
                    });
            });
        });

        it('validate without scheme', function(done){
            Core.controller.clear();
            Core.controller(ValidateExController);
            Core.plugin.clear();
            Core.plugin(require('../plugins/validate')({environment: JSV.env}));
            Core.init({root: __dirname + "/../", mode: 'test'});
            Core.start(url, function(err){
                if (err) throw err;
                request(url)
                    .put('/api/v1/validate_ex')
                    .send({code: "test"})
                    .expect(500, 'Omnis.Validation: model not found: not:found#')
                    .end(function(err){
                        Core.stop();
                        done(err);
                    });
            });
        });

        it('validate without validating', function(done){
            Core.controller.clear();
            Core.controller(ValidateExController);
            Core.plugin.clear();
            Core.plugin(require('../plugins/validate')({environment: JSV.env}));
            Core.init({root: __dirname + "/../", mode: 'test'});
            Core.start(url, function(err){
                if (err) throw err;
                request(url)
                    .get('/api/v1/validate_ex')
                    .expect(200, 'GET')
                    .end(function(err){
                        Core.stop();
                        done(err);
                    });
            });
        });

        it('validate with out configuration', function(done){
            Core.controller.clear();
            Core.controller(SimpleController);
            Core.plugin.clear();
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
    });

});


