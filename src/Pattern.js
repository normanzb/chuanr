/* Pattern */
if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(['./PatternFunction/digit', '../lib/boe/src/boe/Object/clone', './PatternIndexQuery', './PatternConstant'], function ( pfDigit, boeClone, PatternIndexQuery, PatternConstant ) {

    var PLACE_HOLDER_FUNCTION_START = "{";
    var PLACE_HOLDER_FUNCTION_END = "}";
    var PLACE_HOLDER_CALL_START = "(";
    var PLACE_HOLDER_CALL_END = ")";

    var MODE_CONSTANT = PatternConstant.MODE_CONSTANT;
    var MODE_FUNCTION = PatternConstant.MODE_FUNCTION;
    var MODE_PARAMETER = PatternConstant.MODE_PARAMETER;

    var EX_SYNTAX = 'Syntax error';
    var EX_RUNTIME = 'Runtime error';
    var EX_NOT_TAG = 'Not a tag.';
    var EX_NOT_FORMATTED = 'Not a formatted string.';


    /**
     * return a formatted string for throwing exception
     */
    function getSyntaxError(innerError, index) {
        return EX_SYNTAX + ": " + innerError + ":" + index;    
    }
    function getRuntimeError(innerError, index) {
        return EX_RUNTIME + ": " + innerError + ":" + index;    
    }
    function resultToString() {
        return this.result;
    }

    /**
     * Return the opposite tag
     */
    function getOpposite( tag ) {
        if ( tag == PLACE_HOLDER_FUNCTION_START ) {
            return PLACE_HOLDER_FUNCTION_END;
        }
        else if ( tag == PLACE_HOLDER_FUNCTION_END ) {
            return PLACE_HOLDER_FUNCTION_START;
        }
        else if ( tag == PLACE_HOLDER_CALL_START ) {
            return PLACE_HOLDER_CALL_END;
        }
        else if ( tag == PLACE_HOLDER_CALL_END ) {
            return PLACE_HOLDER_CALL_START;
        }

        throw new Error( EX_NOT_TAG );
    }

    /**
     * Parse input as pattern
     */
    function parse(str) {

        var me = this;
        var curChar;
        var mode = MODE_CONSTANT;
        var tmp;
        var stack = [];

        for( var i = 0 ; i < str.length ; i++ ) {

            curChar = str.charAt( i );

            // Check for special chars
            if ( mode == MODE_CONSTANT && 
                curChar == PLACE_HOLDER_FUNCTION_START ) {

                stack.push( { char: curChar, mode: mode } );

                mode = MODE_FUNCTION;

            }
            else if ( mode == MODE_FUNCTION && 
                curChar == PLACE_HOLDER_FUNCTION_END && 
                stack[ stack.length - 1 ].char == PLACE_HOLDER_FUNCTION_START ) {
                
                tmp = stack.pop();

                mode = tmp.mode;

            }
            else if ( mode == MODE_FUNCTION && 
                curChar == PLACE_HOLDER_CALL_START ) {

                stack.push( { char: curChar, mode: mode } )

                mode = MODE_PARAMETER;

            }
            else if ( mode == MODE_PARAMETER && 
                curChar == PLACE_HOLDER_CALL_END && 
                stack[ stack.length - 1 ].char == PLACE_HOLDER_CALL_START ) {

                tmp = stack.pop();

                mode = tmp.mode;

            }
            else {

                if ( mode == MODE_CONSTANT ) {

                    me.items.push( { 
                        type: mode,  
                        value: curChar
                    } );

                }
                else if ( mode == MODE_FUNCTION ) {

                    me.items.push( { 
                        type: mode,  
                        value: curChar,
                        param: ''
                    } );

                }
                else {
                    // must be parameter

                    // check for previous function
                    var prev = me.items[ me.items.length - 1 ];

                    if ( prev.type != MODE_FUNCTION ) {
                        throw new Error( getSyntaxError("Expect a function pattern", i - 1) );
                    }

                    prev.param += curChar;

                }

            }

        }

        if ( stack.length > 0 ) {
            throw new Error( getSyntaxError("Expect a '" + getOpposite( stack[ stack.length - 1 ].char ) + "'", i - 1) );
        }

    };

    function getShorthandDigit(deadDigit){
        return function(input) {
            return pfDigit(input, deadDigit+"");       
        };
    }

    /* Public Methods */

    function Ctor ( pattern ) {

        // a list of items to be matched
        this.items = [];
        this.pattern = pattern;
        this._query = null;
        parse.call(this, pattern);

    }

    var p = Ctor.prototype;

    /**
     * Return an object to decribe if string is matched or how many characters are matched
     */
    p.apply = function ( string, isFullyMatch ) {
        var i, len, input, items, matches = [], item, func, 
            result = '', 
            matched = true,
            matchedCount = 0;

        input = string.toString();
        items = boeClone.call( this.items, true );

        // extract matches
        for( i = 0; i < items.length; i++ ) {
            item = items[i];

            if ( item.type == MODE_FUNCTION ) {
                matches.push( item );
            }
        }

        if ( isFullyMatch ) {
            len = matches.length;
        }
        else {
            len = input.length;
        }

        matchedCount = len;

        // check if matching
        for ( i = 0; i < len && i < matches.length ; i++ ) {

            item = matches[ i ];
            char = input.charAt( i );

            if ( item.type == MODE_FUNCTION ) {

                func = Ctor.functions[ item.value ];

                if ( func == null ) {
                    throw new Error( getRuntimeError( 'Function "' + item.value + '"" was not available.', i ) );
                }

                if ( func.call( null, char, item.param ) === false ) {
                    matched = false;
                    matchedCount = i + 1;
                    break;
                }

                item.value = char;
                item.type = MODE_CONSTANT;

            }

        }

        // Output the final result
        for ( i = 0; i < items.length; i++ ) {
            item = items[i];
            if ( item.type == MODE_CONSTANT ){
                result += item.value;
            }
            else {
                result += ' ';
            }
        }

        return { 
            // the actual string after applied the pattern
            result: result, 
            // indicate if application is successful
            matched: matched, 
            counts: { 
                // the number of total match, successful application means a full match
                total: len, 
                // the actual number of matched.
                matched: matchedCount 
            },
            toString: resultToString
        };
        
    };

    /**
     * Remove the chars which match pattern constants, 
     * return the chars which matched the position of pattern function
     */
    p.extract = function ( str ) {
        if ( str.length != this.items.length ) {
            throw EX_NOT_FORMATTED;
        }

        var ret = [], item, items = this.items;

        for( var i = 0; i < items.length ; i++ ) {
            var item = items[i];

            if ( item.type == MODE_FUNCTION ) {
                ret.push( { 
                    result: str.charAt(i),
                    index: {
                        formatted: i,
                        original: ret.length
                    },
                    toString: resultToString
                });
            }
        }

        ret.toString = function () {
            return this.join('');
        };

        return ret;
    };

    /** 
     * Return index of specified item 
     * @param query query object
     */
    p.index = function(query) {
    
        var ret = new PatternIndexQuery(this, query);

        return ret;
    };

    p.toString = function () {
        return this.pattern;
    };


    /**
     * Map of built-in pattern functions
     */
    Ctor.functions = {
        'd': pfDigit
    };

    for ( var i = 10; i--; ) {
        Ctor.functions[i] = getShorthandDigit(i);
    }

    Ctor.parse = function( str ) {
        var ret = new Ctor( str );
        return ret;
    };

    return Ctor;
});