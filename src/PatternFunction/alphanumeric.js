//>>excludeStart("release", pragmas.release);
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}
//>>excludeEnd("release");

define(['./alphabet', './digit'], function (alphabet, digit) {
    var ret = function(curChar, param, context){
        var result = false;

        try {
            result = alphabet.apply(this, arguments);    
        }
        catch(){}

        if ( result ) {
            return result;
        }

        try {
            result = digit.apply(this, arguments);    
        }
        catch(){}
        
        return result;
    };

    return ret;
});