//>>excludeStart("release", pragmas.release);
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}
//>>excludeEnd("release");

define(function(){
    return {
        MODE_CONSTANT : 1,
        MODE_FUNCTION : 2,
        MODE_PARAMETER : 4,
        TYPE_POSITIVE : 0,
        TYPE_NEGATIVE : 1,
        TYPE_REGEXP : 2,
        TYPE_PASSIVE : 4
    };
});