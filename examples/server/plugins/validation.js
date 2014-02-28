/**
 * Created by Andy <andy@sumskoy.com> on 28/02/14.
 */

var plugin = function($util, $annotations, $errors){

    function ValidationError(ex){
        $errors.HttpError.call(this, "Validation error", ex);
        this.data.code = 400;
    }
    $util.inherits(ValidationError, $errors.HttpError);

    function Validation(schema, from, $default){
        if ($default){
            this.from = '';
            this.schema = $default;
        } else {
            this.from = from || '';
            this.schema = schema || null;
        }
    }

    $util.inherits(Validation, $annotations.BeforeRoute);

    Validation.prototype.middleware = function(req, res){
        if (!req.body.name) throw new ValidationError("schema: "+this.schema+" name is empty");
    };

    return Validation;
};

module.exports = exports = {
    name: "Validation",
    type: "annotation",
    filename: __filename,
    fn: plugin
};