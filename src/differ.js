if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}

define(function () {
    var differ = {
        diff: function(original, updated){
            var curChar, i, left = -1, right = -2, ret, longerCaret, shorterCaret, 
                longer, shorter, reverse = 0;

            if ( original.length > updated.length ) {
                longer = original;
                shorter = updated;  
            } 
            else {
                longer = updated;
                shorter = original;
                reverse = 1;
            }

            // compare form left to right
            for( i = 0; i < longer.length; i++ ) {
                curChar = longer.charAt(i);

                if ( curChar != shorter.charAt(i) ) {
                    left = i;
                    break;
                }
            }

            for( i = longer.length; i--; ) {
                curChar = longer.charAt(i);

                if ( i <= left || curChar != shorter.charAt( shorter.length - (longer.length - i) ) ) {
                    right = i;
                    break;
                }
            }

            longerCaret = {
                begin: left,
                end: right + 1
            };

            shorterCaret = {
                begin: left,
                end: shorter.length - ( longer.length - right ) + 1 
            };

            ret = {
                deletion: { 
                    text: longer.substring( longerCaret.begin, longerCaret.end ),
                    caret: longerCaret
                },
                insertion: {
                    text: shorter.substring( shorterCaret.begin, shorterCaret.end ),
                    caret: shorterCaret
                }
            };

            if ( reverse ) {
                var tmp = ret.deletion;
                ret.deletion = ret.insertion;
                ret.insertion = tmp;
            }

            return ret;
        }
    };

    return differ;
});