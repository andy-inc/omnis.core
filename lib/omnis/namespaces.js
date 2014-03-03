/**
 * Created by Andy <andy@sumskoy.com> on 03/03/14.
 */

function Namespace (name, debug){
    this.name = name;
    this.debug = debug;
    this._modules = {};
}

Namespace.prototype.register = function(name, module){
    if (this.debug){
        console.log("Register in @" + this.name + ": " + name);
    }
    this._modules[name] = module;
};

Namespace.prototype.get = function(name){
    return this._modules[name];
};

Namespace.prototype.getAll = function(){
    return Object.keys(this._modules);
};

Namespace.prototype.setDebug = function(value){
    this.debug = value;
};

function Namespaces (debug){
    this.debug = debug;
    this._namespaces = [new Namespace(this.default, this.debug)];
}

Namespaces.prototype.register = function(fullname, module){
    var s = fullname.split('.');
    var name = s.pop();
    var namespace = s.join('.');
    var ns = this.findNamespace(namespace);
    if (ns == null){
        ns = new Namespace(namespace, this.debug);
        this._namespaces.push(ns);
    }
    ns.register(name, module);
};

Namespaces.prototype.findNamespace = function(name){
   if (name == '') name = this.default;
   for(var i = 0; i < this._namespaces.length; i++){
       if (this._namespaces[i].name === name){
           return this._namespaces[i];
       }
   }
    return null;
};

Namespaces.prototype.get = function(fullname){
    var s = fullname.split('.');
    var name = s.pop();
    var namespace = s.join('.');
    var ns = this.findNamespace(namespace);
    if (ns == null) return null;
    return ns.get(name);
};

Namespaces.prototype.default = '$default';

Namespaces.prototype.getAll = function(){
    var result = [];
    this._namespaces.forEach(function(ns){
        result = result.concat(ns.getAll().map(function(el){ return ns.name + "." + el; }));
    });
    return result;
};

Namespaces.prototype.setDebug = function(value){
    this.debug = value;
    for(var i = 0; i < this._namespaces.length; i++){
        this._namespaces[i].setDebug(value);
    }
};

exports.Namespace = Namespace;
exports.Namespaces = Namespaces;