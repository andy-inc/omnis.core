/**
 * Created by Andy <andy@sumskoy.com> on 03/03/14.
 */
var di = require('./di').di;

var fn = function(){
    return function($default){
        this.$default = $default;
    };
};

di.register({
    filename: __filename,
    fn: fn,
    name: 'Validation',
    type: 'annotation'
});