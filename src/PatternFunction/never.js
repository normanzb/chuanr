//>>excludeStart("release", pragmas.release);
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}
//>>excludeEnd("release");
define( function duplicate() {
    var ret = function(input, param, context){
        if ( param == '' || param == null || 
            input === '' || 
            input === context.pattern.config.placeholder.empty ){
            return false;
        }

        if ( param == '=' ) {
            return !(context.prev === input);
        }

        return !(input === param);
    };

    return ret;
});