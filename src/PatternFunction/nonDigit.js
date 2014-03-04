if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}

define( function () {
    var ret = function(input, param, context){
        return /^\D$/.test( input );
    };

    return ret;
});