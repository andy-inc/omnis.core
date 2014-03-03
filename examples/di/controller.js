/**
 * Created by Andy <andy@sumskoy.com> on 03/03/14.
 */
var di = require('./di').di;

var fn = function(model){
    return {
        ip: model.ip
    };
};

di.register({
    filename: __filename,
    fn: fn,
    ns: "$default",
    name: 'controller'
});