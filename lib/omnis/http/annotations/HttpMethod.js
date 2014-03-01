/**
 * Created by Andy <andy@sumskoy.com> on 28/02/14.
 */
var $path = require('path');

var HttpMethod = function(url, method, $default){
    if ($default != null){
       url = $default;
       method = "GET";
    }
    this.url = url;
    this.method = (method != null ? method.toUpperCase() : undefined);
};

HttpMethod.prototype.getRoute = function(){
    return {
        method: (this.method != null ? this.method : "GET"),
        url: (this.url != null ? this.url : "/")
    };
};

HttpMethod.prototype.module = function(annotation){
    var url = this.url,
        method = this.method;
    if (annotation.url != null && url == null){
        url = annotation.url;
    } else if (annotation.url != null && url != null){
        if (annotation.url.substr(0, 1) === '/'){
            url = annotation.url;
        } else {
            url = $path.join(url, annotation.url);
        }
    }
    if (annotation.method != null && method == null){
        method = annotation.method;
    } else if (annotation.method != null && method != null){
        method = annotation.method;
    }
    return new HttpMethod(url, method);
};

module.exports = exports = HttpMethod;