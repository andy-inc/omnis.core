/**
 * Created by Andy <andy@sumskoy.com> on 03/03/14.
 */
var di = require('./di').di;

var fn = function(){
    return {
        ip: "0.0.0.0"
    };
};

di.register({
    filename: __filename,
    fn: fn,
    name: 'config'
});