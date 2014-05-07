//>>excludeStart("release", pragmas.release);
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}
//>>excludeEnd("release");
define( function () {
    return function(curChar, param, context){
        if ( param == null || param == '' || param == false ) {
            return true;    
        }
        
        return new RegExp("^[" + param + "]$").test( curChar );
    };
});