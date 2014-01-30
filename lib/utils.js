/**
 * Created by Andy <andy@sumskoy.com> on 20/12/13.
 */
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
