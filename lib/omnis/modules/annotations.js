/**
 * Created by Andy <andy@sumskoy.com> on 03/03/14.
 */
var BeforeRoute = require('../http/annotations/BeforeRoute'),
    AfterRoute = require('../http/annotations/AfterRoute');

module.exports = exports = {
    name: "$annotations",
    filename: __filename,
    fn: function(){
        return {
            BeforeRoute: BeforeRoute,
            AfterRoute: AfterRoute
        }
    },
    type: "system"
};