/**
 * Created by Andy <andy@sumskoy.com> on 03/03/14.
 */
var OmnisError = require('../errors/OmnisError').OmnisError,
    HttpError = require('../errors/HttpError').HttpError,
    Http500Error = require('../errors/HttpError').Http500Error;
module.exports = exports = {
    name: "errors",
    filename: __filename,
    fn: function(){
        return {
            OmnisError: OmnisError,
            HttpError: HttpError,
            Http500Error: Http500Error
        }
    },
    type: "system"
};