/**
 * Created by Andy <andy@sumskoy.com> on 27/02/14.
 */
global.$app.module('db', __filename, function(config, $mongodb, $q){
    var _db;
    var DB = {

        get: function(){
            return _db;
        },

        collection: function(){
            var args = Array.prototype.slice.call(arguments);
            return _db.collection.apply(_db, args);
        }

    };

    var MongoClient = $mongodb.MongoClient;
    var deferred = $q.defer();
    MongoClient.connect(config.db.url, function(err, result){
        _db = result;
        if (err) return deferred.reject(err);
        return deferred.resolve(DB);
    });
    return deferred.promise;
});
