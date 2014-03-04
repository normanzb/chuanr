if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}

define( function () {

    var EX_NOT_CORRECT_PARAM = "Not a correct parameter format";
    var EX_NOT_CORRECT_RANGE = "Expect the range to be a-zA-Z";

    var AZAZ = "a-zA-Z";
    var regexAlphbet = new RegExp("[" + AZAZ + "]");
    var regexAcceptableParam = new RegExp("[^" + AZAZ + "\-]");

    function noPrev (context){
        if ( context == null || context.prev == null || 
            regexAlphbet.test(context.prev) != true ) {
            return true;
        }

        return false;
    }

    var ret = function(input, param, context){

        if ( param == '=' ) {
            if ( noPrev(context) ) {
                return false;
            }
            else {
                return input == context.prev;
            }
        }

        if ( param.charAt(0) == '+' || param.charAt(0) == '-' ) {
            if ( noPrev(context) ) {
                return false;
            }
            else {
                if ( param.length == 1 ) {
                    param += '1';
                }

                if ( Math.abs(param >> 0) >= 10 ) {
                    throw new Error( EX_NOT_CORRECT_RANGE );
                }

                return input.charCodeAt(0) == ( context.prev * 1 + ( param >> 0 ) ).charCodeAt(0);
            }
        }

        if ( param == null || (param == 0 && param !== '0') ) {
            param = AZAZ;
        }

        if ( regexAcceptableParam.test( param ) ) {
            throw new Error( EX_NOT_CORRECT_PARAM );
        }
        
        return new RegExp("^[" + param + "]$").test( input );
    };

    return ret;
});