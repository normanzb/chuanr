if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}

define(function(){
    return {
        MODE_CONSTANT : 1,
        MODE_FUNCTION : 2,
        MODE_PARAMETER : 4
    };
});