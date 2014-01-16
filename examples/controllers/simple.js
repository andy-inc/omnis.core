/**
 * Created by Andy <andy@sumskoy.com> on 20/12/13.
 */

var SimpleController = function(){
    this.version = 'v1';
    this.route = '/simple';
};

SimpleController.prototype.get = function(req, res, next){
    res.send({hello: 'World'});
};

SimpleController.prototype.delete = function(req, res, next){
    res.send({hello: this.initData});
};

SimpleController.prototype.init = function(omnis, callback){
    this.initData = "TEST";

    callback();
};

module.exports = exports = new SimpleController();