/* 
    speculation module
    guess what user really want to input
*/
//>>excludeStart("release", pragmas.release);
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}
//>>excludeEnd("release");
define(
[
    './differ', 
    '../lib/boe/src/boe/String/trim'
    //>>excludeStart("release", pragmas.release);
    , './shim/console'
    //>>excludeEnd("release");
],
function 
(
    differUtil,
    trim
    //>>excludeStart("release", pragmas.release);
    , console
    //>>excludeEnd("release");
) {
    'use strict';

    return function speculateBatchInput( chuanr, input, format, caret, tryExtractAndResetCaret ){

        var speculated, prevInput, prevExtraction, differ, curChar, inserted;

        //>>excludeStart("release", pragmas.release);
        console.log('Try to be smart, figure out what the user actually want to input');
        console.log('Speculation Step 1. Try Extract');
        //>>excludeEnd("release");
        speculated = tryExtractAndResetCaret.call( chuanr, chuanr._el.value, null );

        if ( speculated == null ) {

            //>>excludeStart("release", pragmas.release);
            console.log('Failed to extract.');
            console.log('Speculation Step 2. Try compare with basic format');
            //>>excludeEnd("release");
            speculated = input;

            if ( speculated != null && trim.call(speculated) !== '' ) {
                // caret type still unknown, a bit trick here
                // according to https://github.com/normanzb/chuanr/issues/11
                //>>excludeStart("release", pragmas.release);
                console.log('Speculation Step 2.5. Comparing to previous input to get differ');
                //>>excludeEnd("release");
                
                prevInput = chuanr._untouched ? chuanr._untouched.result + '' : '';

                try{
                    prevExtraction = chuanr.formatter.extract( prevInput );
                }
                catch(ex){}

                if (prevExtraction) {

                    differ = differUtil.diff(prevInput, input);

                    //>>excludeStart("release", pragmas.release);
                    console.log('Differ:', differ);
                    //>>excludeEnd("release");

                    if (prevExtraction.length > 0) {

                        //>>excludeStart("release", pragmas.release);
                        console.log('Previous input extraction:', prevExtraction + '');
                        //>>excludeEnd("release");

                        speculated = '';
                        inserted = false;

                        // find extracted char who is in vanicity of newly modified content
                        for(var i = 0; i < prevExtraction.length; i++) {
                            curChar = prevExtraction[i];
                            if (inserted === false && curChar.index.formatted === differ.insertion.caret.begin) {
                                speculated += differ.insertion.text;
                                inserted = true;
                            }

                            speculated += curChar.result;
                        }

                        if (inserted === false) {
                            speculated += differ.insertion.text;
                        }
                    }
                    else {
                        speculated = differ.insertion.text;
                    }
                }
            }

        }

        if (speculated == null || speculated === '') {
            //>>excludeStart("release", pragmas.release);
            console.log('Speculation Step 3. Try filter out puncuation and spaces.');
            //>>excludeEnd("release");
            speculated = input.replace(/\W/g,'');
        }
        else {
            // give up 
            //>>excludeStart("release", pragmas.release);
            console.log('Extracted, use extracted string.');
            //>>excludeEnd("release");
            
            // can be extracted without problem mean the original string is formatted
            caret.type = 1;
        }

        //>>excludeStart("release", pragmas.release);
        console.log('Speculation Done, Result "' + speculated + '"');
        //>>excludeEnd("release");
        return trim.call(speculated);
    };
});