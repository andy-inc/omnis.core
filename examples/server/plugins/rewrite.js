/**
 * Created by Andy <andy@sumskoy.com> on 04/03/14.
 */
var plugin = function(){
    return function(req, res){
        if  (req.url == '/'){
            req.url = '/api/index';
        }
    };
};

module.exports = exports = {
    name: "rewrite",
    type: "middleware:before:all",
    filename: __filename,
    fn: plugin
};