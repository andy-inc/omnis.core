/**
 * Created by Andy <andy@sumskoy.com> on 20/12/13.
 */

var JSV = require('JSV').JSV.env;
var errors = require('../../lib/errors');

var ValidateController = function(){
    this.version = 'v1';
    this.route = '/validate';
    this.plugins = {
        validate: {
            post: "validate:post#",
            put: {model: "validate:post#", error: function(err, req, res, next){
                if (errors.OmnisValidationFailed.instanceof(err)){
                    res.send(400, "ERROR: " + err.exception.errors.map(function(err){ return err.message; }));
                } else {
                    next(err);
                }
            }}
        }
    };
};

ValidateController.prototype.post = function(req, res, next){
    res.send(req.body);
};

ValidateController.prototype.put = function(req, res, next){
    res.send(req.body);
};

JSV.createSchema({
    "$schema":"http://json-schema.org/draft-03/schema#",
    "id": "validate:post#",
    "type": "object",
    "additionalProperties": false,
    "properties": {
        "code": {
            "type": "string",
            "required": true,
            "minLength": 1
        }
    }
});

module.exports = exports = new ValidateController();