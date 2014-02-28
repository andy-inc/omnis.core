/**
 * Created by Andy <andy@sumskoy.com> on 27/02/14.
 */
global.$app.declare('indexCtrl', __filename, ['namesModel', function(model){

    return {
        /**
         * Index route
         *
         * @HttpMethod(url="/")
         */
        index: function(req, res){
            return model.find().then(function(names){
                return res.send(names);
            });
        },

        /**
         * Insert new name
         *
         * @HttpMethod(method="POST", url="/name")
         * @Validation()
         */
        insertNewName: function(req, res){
            return model.insert(req.body).then(function(result){
                return res.send(result);
            });
        },

        /**
         *
         * @HttpMethod(url="/test")
         * @ViewPath("$__dirname/../views")
         */
        testView: function(req, res){
            res.render('test', {data: 1});
        }
    };

}]);