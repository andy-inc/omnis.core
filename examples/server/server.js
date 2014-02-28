/**
 * Created by Andy <andy@sumskoy.com> on 27/02/14.
 */
var Omnis = require('../..').$omnis(__dirname);
var app = global.$app = Omnis.$application("test");

app.paths('**/*.js', '!**/node_modules/**', '!server.js');

app.findFiles('**/schemas/**/*.json', '!**/node_modules/**').then(function(files){
    //Import schemas
});

app.setup().then(function(){
    return app.start();
}).then(function(){
    var point = app.getHttpPoint();
    console.log("Listen on http://" + point.ip + ":" + point.port );
}).fail(function(err){
    console.log(err);
});
