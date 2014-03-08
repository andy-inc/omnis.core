/**
 * Created by Andy <andy@sumskoy.com> on 28/02/14.
 */
var util = require('util');
var OmnisError = require('./OmnisError').OmnisError;

function HttpError(code, msg, ex){
    OmnisError.call(this, msg, ex);
    this.data.code = code;
}
util.inherits(HttpError, OmnisError);

function Http500Error(ex){
    HttpError.call(this, "Server internal error", ex);
    this.data.code = 500;
}
util.inherits(Http500Error, HttpError);

exports.HttpError = HttpError;
exports.Http500Error = Http500Error;