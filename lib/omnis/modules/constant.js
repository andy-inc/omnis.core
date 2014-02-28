/**
 * Created by Andy <andy@sumskoy.com> on 28/02/14.
 */
module.exports = exports = {
    name: "constant",
    filename: __filename,
    fn: function(){
        var names = {};
        return {
            get: function(name, def){
                if (names[name] == null) return def;
                return names[name];
            },

            set: function(name, value){
                names[name] = value;
            }
        }
    },
    type: "system"
};