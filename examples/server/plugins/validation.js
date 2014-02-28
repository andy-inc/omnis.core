/**
 * Created by Andy <andy@sumskoy.com> on 28/02/14.
 */
global.$app.declare('ValidationError', __filename, function($util, $errors){
    function ValidationError(ex){
        $errors.HttpError.call(this, "Validation error", ex);
        this.data.code = 400;
    }
    $util.inherits(ValidationError, $errors.HttpError);
    return ValidationError;
});

global.$app.annotation('Validation', __filename, function($util, $BeforeRoute, ValidationError){

    var Validation = function(schema, from, $default){
        if ($default){
            this.from = '';
            this.schema = $default;
        } else {
            this.from = from || '';
            this.schema = schema || null;
        }
    };

    $util.inherits(Validation, $BeforeRoute);

    Validation.prototype.getMiddleware = function(){
        var self = this;
        return function(req, res, next){
            if (!req.body.name){
                next(new ValidationError("schema: "+self.schema+" name is empty"));
            } else {
                next();
            }
        };
    };

    return Validation;
});