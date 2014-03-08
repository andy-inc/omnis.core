/**
 * Created by Andy <andy@sumskoy.com> on 04/03/14.
 */

function Response(original){
    this.$original = original;
    this.$viewRoot = null;
    this.$responseType = 'html';
    Object.defineProperty(this, "locals", {
        get: function () {
            return original.locals;
        },
        set: function (newValue) {
            original.locals = newValue;
        }
    });
}

Response.prototype.render = function(view, options){
    return {
        $responseType: "render",
        $template: view,
        $data: options
    };
};

Response.prototype.send = function(code, data){
    if (typeof code !== "number"){
        return {
            $responseType: "html",
            $data: code
        };
    } else {
        return {
            $responseType: "html",
            $data: data,
            $code: code
        };
    }
};

Response.prototype.json = function(code, data){
    if (typeof code !== "number"){
        return {
            $responseType: "json",
            $data: code
        };
    } else {
        return {
            $responseType: "json",
            $data: data,
            $code: code
        };
    }
};

Response.prototype.sendfile = function(fn, options){
    return {
        $responseType: "file",
        $data: fn,
        $options: options
    };
};

Response.prototype.redirect = function(url){
    return {
        $responseType: "redirect",
        $data: url
    };
};

Response.prototype.$send = function(result){
    if (typeof result === 'object' && result.$responseType){
        if (result.$code){
            this.$original.status(result.$code);
        }
        if (result.$responseType === 'html'){
            this.$original.send(result.$data);
        } else if (result.$responseType === 'json'){
            this.$original.json(result.$data);
        } else if (result.$responseType === 'render'){
            this.$original.render(result.$template, result.$data);
        } else if (result.$responseType === 'file'){
            this.$original.sendfile(result.$data, result.$options);
        } else if (result.$responseType === 'redirect'){
            this.$original.redirect(result.$data);
        } else {
            this.$original.send(result.$data);
        }

    } else if (result === null) {
        this.$original.send(204, null);
    } else {
        this.$original.send(result);
    }
};

Response.prototype.setHeader = function(name, value){
    return this.$original.setHeader(name, value);
};

Response.prototype.getHeader = function(name){
    return this.$original.getHeader(name);
};

exports.Response = Response;