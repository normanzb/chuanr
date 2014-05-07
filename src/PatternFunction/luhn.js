//>>excludeStart("release", pragmas.release);
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}
//>>excludeEnd("release");
define( ['./digit'], function ( digit ) {
    return function( curChar, param, context ){
        var input = context.input;

        if ( digit( curChar, "", context ) == false ) {
            return false;
        }

        // Apply the Luhn algorithm
        var sum = 0;
        var alt = false;
        var num = 0;

        // Walk backwards through the number string
        for (var i = input.length - 1; i >= 0; i--) {

            // Get the numeric value for the current index
            num = input.charAt(i) >> 0;

            if (alt) {
                num *= 2;
                if (num > 9) {
                    num -= 9;
                }
            }

            sum += num;
            alt = !alt;
        }

        // Mod 10
        return (sum % 10 === 0);

    };
});
    