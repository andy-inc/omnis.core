/**
 * Created by Andy <andy@sumskoy.com> on 28/02/14.
 */
var util = require('util');

function OmnisError(msg, ex) {
    Error.call(this);
    if (ex == null || !(ex instanceof Error)){
        Error.captureStackTrace(this, this.constructor);
    } else {
        this.stack = ex.stack;
    }
    this.name = this.constructor.name;
    this.message = msg;
    this.ex = ex;
    this.data = {};
}
util.inherits(OmnisError, Error);
OmnisError.prototype.toJSON = function(){
    var result = {
        name: this.name,
        message: this.message
    };
    for(var key in this.data) if (this.data.hasOwnProperty(key)){
        result[key] = this.data[key];
    }
    if (this.ex && this.ex instanceof OmnisError){
        result.ex = this.ex.toJSON();
    } else if (this.ex && this.ex instanceof Error){
        result.ex = {
            name: this.ex.name,
            message: this.ex.message
        };
    } else if (this.ex){
        result.ex = this.ex;
    }
    return result;
};

exports.OmnisError = OmnisError;


