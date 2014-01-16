/**
 * Created by Andy <andy@sumskoy.com> on 20/12/13.
 */
var ValidateExController = function(){
    this.version = 'v1';
    this.route = '/validate_ex';
    this.plugins = {
        validate: {
            post: {model: {
                "type": "object",
                "additionalProperties": false,
                "properties": {
                    "code_ex": {
                        "type": "string",
                        "required": true
                    }
                }
            }},
            put: "not:found#"
        }
    };
};

ValidateExController.prototype.post = function(req, res, next){
    res.send(req.body);
};

ValidateExController.prototype.put = function(req, res, next){
    res.send(req.body);
};

ValidateExController.prototype.get = function(req, res, next){
    res.send("GET");
};



module.exports = exports = new ValidateExController();