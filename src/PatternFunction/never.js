//>>excludeStart("release", pragmas.release);
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}
//>>excludeEnd("release");
define( function duplicate() {
    var ret = function(curChar, param, context){
        if ( param == '' || param == null || 
            curChar === '' || 
            curChar === context.pattern.config.placeholder.empty ){
            return false;
        }

        if ( param == '=' ) {
            return !(context.prev === curChar);
        }

        return !(curChar === param);
    };

    return ret;
});