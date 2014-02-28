/**
 * Created by Andy <andy@sumskoy.com> on 26/02/14.
 */
var $annotations = require('../').$annotations;

$annotations.define('HttpMethod', $annotations.$method, function(action, url, $default){
    this.action = action === undefined ? "____" : action;
    this.url = url  === undefined ? "____" : url;
    this.def = $default  === undefined ? "____" : $default;
});

/**
 * @HttpMethod(action="POST")
 */
var act_post = function(){

};

/**
 * @HttpMethod(url="/url")
 */
var url_set = function(){

};

/**
 * @HttpMethod(url="/url", action = "HEAD")
 */
var act_url_set = function(){

};

/**
 * @HttpMethod("/default")
 */
var def = function(){

};

/**
 * @HttpMethod("test")
 */
var def_test = function(){

};

/**
 * @HttpMethod()
 */
var empty_test = function(){

};

/**
 * @HttpMethod
 */
var empty_full_test = function(){

};

/**
 * @HttpMethod(55)
 */
var int_set = function(){

};

/**
 * @HttpMethod(true)
 */
var bool_set = function(){

};

/**
 * @HttpMethod(null)
 */
var null_set = function(){

};

/**
 *
 * @param req
 * @param res
 * @param next
 * @HttpMethod("/api/query")
 */
exports.action = function(req, res, next){

};

var obj = {

    /**
     * @HttpMethod("sub action")
     */
    sub_action:function(req, res, next){

    }
};

$annotations.get(__filename).then(function(result){
    console.log(result);
});