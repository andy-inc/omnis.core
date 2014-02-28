/**
 * Created by Andy <andy@sumskoy.com> on 28/02/14.
 */
var HttpMethod = function(url, method, $default){
    if ($default != null){
       url = $default;
       method = "GET";
    }
    this.url = (url != null ? url : "/");
    this.method = (method != null ? method.toUpperCase() : "GET");
};

HttpMethod.prototype.getRoute = function(){
    return {
        method: this.method,
        url: this.url
    };
};
module.exports = exports = HttpMethod;