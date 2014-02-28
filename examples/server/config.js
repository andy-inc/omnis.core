/**
 * Created by Andy <andy@sumskoy.com> on 27/02/14.
 */
require('../..').$omnis().$application("test").module('config', __filename, function(){
    return {
        db: {
            url: "mongodb://localhost/test"
        }
    }
});