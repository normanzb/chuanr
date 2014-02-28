if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}

define( function () {
    var ret = function(input, param){

        if ( param == null || param == false ) {
            param = "0-9";
        }
        
        return new RegExp("^[" + param + "]$").test( input );
    };

    return ret;
});