/**
 * Created by Andy <andy@sumskoy.com> on 27/02/14.
 */
global.$app.declare('namesModel', __filename, function($q, db){
    var collection = db.collection("names");

    var model = {
        find: function(){
            var cursor = collection.find({});
            return $q.ninvoke(cursor, 'toArray');
        },
        insert: function(data){
            return $q.ninvoke(collection, 'insert', data);
        }
    };

    return $q.ninvoke(collection, 'count', {}).then(function(count){
        if (count === 0){
            return $q.ninvoke(collection, 'insert', [{name: "Andy"}, {name: "Stacy"}]);
        }
        return false;
    }).then(function(){
        return model;
    });
});