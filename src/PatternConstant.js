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
        TYPE_POSITIVE : 'positive',
        TYPE_NEGATIVE : 'negative',
        TYPE_PARTIAL : 'partial'
    };
});