/**
 * Created by Andy <andy@sumskoy.com> on 27/02/14.
 */
var Omnis = require('../..').$omnis(__dirname);
var app = global.$app = Omnis.$application("test");

app.init({
    debug: true,
    ip: "127.0.0.1",
    port: 3001,
    static: ["./static"],
    views: {
        cache: true
    },
    cookie: "secret",
    session: {
        "options": {
            "secret": "very secret worlds"
        }
    }
}).then(function(){
   return app.search('plugins/**/*.js').then(function(result){
       return app.mapSeries(result, function(el){
           return app.plugin(require(el));
       });
   });
}).then(function(){
    app.paths('./*.js', '!**/node_modules/**', '!server.js');
    app.paths('modules/**/*.js');
}).then(function(){
   return app.setup();
}).then(function(){
    return app.start();
}).then(function(){
    var point = app.status();
    console.log("Listen on http://" + point.ip + ":" + point.port );
}).fail(function(err){
    console.log(err.stack);
});
