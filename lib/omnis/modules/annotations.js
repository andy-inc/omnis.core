/**
 * Created by Andy <andy@sumskoy.com> on 03/03/14.
 */
var BeforeRoute = require('../http/annotations/BeforeRoute');

module.exports = exports = {
    name: "annotations",
    filename: __filename,
    fn: function(){
        return {
            BeforeRoute: BeforeRoute
        }
    },
    type: "system"
};