/**
 * Created by Andy <andy@sumskoy.com> on 03/03/14.
 */
var di = require('./di').di;

/**
 *
 * @Validation()
 */
var fn = function(config){
    return {
        ip: config.ip
    };
};

di.register({
    filename: __filename,
    fn: fn,
    name: 'model'
});