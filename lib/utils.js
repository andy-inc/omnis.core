/**
 * Created by Andy <andy@sumskoy.com> on 20/12/13.
 */

var mode = 'production';

/**
 * Check is function
 *
 *
 * @param {*} fn
 * @returns {boolean}
 */
exports.isFunction = function(fn) {
    var getType = {};
    return fn && getType.toString.call(fn) === '[object Function]';
};

/**
 * Write debug info
 */
exports.debug = function(){
    if (mode === 'debug' || mode === 'test'){
        console.log.apply(console, arguments);
    }
};

exports.setMode = function(m){
    mode = m;
};