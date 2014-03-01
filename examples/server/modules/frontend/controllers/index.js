/**
 * Created by Andy <andy@sumskoy.com> on 27/02/14.
 */
/**
 * @HttpMethod(url="/api/")
 * @ViewPath("$__dirname/../")
 */
global.$app.module('indexCtrl', __filename, ['namesModel', function(model){

    return {
        /**
         * Index route
         *
         * @HttpMethod(url="index")
         */
        index: function(req, res){
            return model.find().then(function(names){
                return res.send(names);
            });
        },

        /**
         * Insert new name
         *
         * @HttpMethod(method="POST", url="save")
         * @Validation()
         */
        insertNewName: function(req, res){
            return model.insert(req.body).then(function(result){
                return res.send(result);
            });
        },

        /**
         *
         * @HttpMethod(url="test")
         * @ViewPath("views")
         */
        testView: function(req, res){
            return res.render('test', {data: 1});
        }
    };

}]);