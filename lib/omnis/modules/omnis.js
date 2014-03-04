/**
 * Created by Andy <andy@sumskoy.com> on 03/03/14.
 */
var $extend = require('node.extend'),
    $clone = require('clone');


module.exports = exports = {
    name: "$omnis",
    filename: __filename,
    fn: function(){
        return {
            extend: $extend,
            clone: $clone
        }
    },
    type: "system"
};