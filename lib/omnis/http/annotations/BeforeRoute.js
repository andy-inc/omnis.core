/**
 * Created by Andy <andy@sumskoy.com> on 28/02/14.
 */
var BeforeRoute = function($default){

};

BeforeRoute.prototype.getMiddleware = function(){
    return function(req, res, next){
        next();
    };
};
module.exports = exports = BeforeRoute;