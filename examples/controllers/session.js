/**
 * Created by Andy <andy@sumskoy.com> on 20/12/13.
 */

module.exports = exports = {
    version: 'v1',
    route: '/session',


    get: function(req, res, next){
        res.send({name: req.session.name});
    },

    post: function(req, res, next){
        req.session.name = req.param('name','');
        res.send(204, '');
    }
};