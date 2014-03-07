//>>excludeStart("release", pragmas.release);
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}
//>>excludeEnd("release");
define( function () {
    var ret = function(input, param, context){
        return /^\D$/.test( input );
    };

    return ret;
});