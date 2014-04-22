//>>excludeStart("release", pragmas.release);
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}
//>>excludeEnd("release");

define( function () {

    var EX_NOT_CORRECT_PARAM = "Not a correct parameter format";
    var EX_NOT_CORRECT_RANGE = "Expect the range to be 0-9";

    var regexNumeric = /[0-9]/;
    var regexAcceptableParam = /[^0-9\-]/;

    function noPrev (context){
        if ( context == null || context.prev == null || 
            regexNumeric.test(context.prev) != true ) {
            return true;
        }

        return false;
    }

    var ret = function(input, param, context){

        if ( param == '?' ) {
            if ( input == '' || input == ' ') {
                return true;
            }
            else {
                param = '';
            }
        }

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

                return input == ( context.prev * 1 + ( param >> 0 ) );
            }
        }

        if ( param == null || (param == 0 && param !== '0') ) {
            param = "0-9";
        }

        if ( regexAcceptableParam.test( param ) ) {
            throw new Error( EX_NOT_CORRECT_PARAM );
        }
        
        return new RegExp("^[" + param + "]$").test( input );
    };

    return ret;
});