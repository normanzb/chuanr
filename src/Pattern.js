/* Pattern */
//>>excludeStart("release", pragmas.release);
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}
//>>excludeEnd("release");

define([
    './util',
    './PatternFunction/digit', 
    './PatternFunction/alphabet', 
    './PatternFunction/duplicate',
    './PatternFunction/never',
    './PatternFunction/everything',
    './PatternFunction/luhn',
    '../lib/boe/src/boe/Object/clone', 
    '../lib/boe/src/boe/util', 
    './PatternIndexQuery', 
    './PatternConstant'
], function ( util,
    pfDigit, pfAlphabet, pfDuplicate, pfNever, pfEverything, pfLuhn,
    boeClone, boeUtil, PatternIndexQuery, PatternConstant ) {

    var PLACE_HOLDER_FUNCTION_START = "{";
    var PLACE_HOLDER_FUNCTION_END = "}";
    var PLACE_HOLDER_CALL_START = "(";
    var PLACE_HOLDER_CALL_END = ")";
    var PLACE_HOLDER_TYPE_SEPARATOR = "|";

    var TYPE_POSITIVE = PatternConstant.TYPE_POSITIVE;
    var TYPE_NEGATIVE = PatternConstant.TYPE_NEGATIVE;
    var TYPE_PARTIAL = PatternConstant.TYPE_PARTIAL;
    var TYPE_PASSIVE = PatternConstant.TYPE_PASSIVE;

    var MODE_CONSTANT = PatternConstant.MODE_CONSTANT;
    var MODE_FUNCTION = PatternConstant.MODE_FUNCTION;
    var MODE_PARAMETER = PatternConstant.MODE_PARAMETER;

    var EX_SYNTAX = 'Syntax error';
    var EX_RUNTIME = 'Runtime error';
    var EX_NOT_TAG = 'Not a tag.';
    var EX_NOT_FORMATTED = 'Not a formatted string.';

    var defaultSettings = {
        placeholder: {
            empty: ' '
        }
    };

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
            if ( i == 0 && str.charAt( i + 1 ) == PLACE_HOLDER_TYPE_SEPARATOR ) {
                if ( curChar == '-' ) {
                    me.type |= TYPE_NEGATIVE;
                }
                else if ( curChar == '~' ) {
                    me.type |= TYPE_NEGATIVE;
                    me.type |= TYPE_PARTIAL;
                }
                else if ( curChar == '_' ) {
                    me.type |= TYPE_NEGATIVE;
                    me.type |= TYPE_PASSIVE;
                }
            }
            else if ( i <= 1 && curChar == PLACE_HOLDER_TYPE_SEPARATOR ) {
                // skip it
            }
            else if ( mode == MODE_CONSTANT && 
                curChar == PLACE_HOLDER_FUNCTION_START ) {

                stack.push( { 'char': curChar, mode: mode } );

                mode = MODE_FUNCTION;

            }
            else if ( mode == MODE_FUNCTION && 
                curChar == PLACE_HOLDER_FUNCTION_END && 
                stack[ stack.length - 1 ]['char'] == PLACE_HOLDER_FUNCTION_START ) {
                
                tmp = stack.pop();

                mode = tmp.mode;

            }
            else if ( mode == MODE_FUNCTION && 
                curChar == PLACE_HOLDER_CALL_START ) {

                stack.push( { 'char': curChar, mode: mode } )

                mode = MODE_PARAMETER;

            }
            else if ( mode == MODE_PARAMETER && 
                curChar == PLACE_HOLDER_CALL_END && 
                stack[ stack.length - 1 ]['char'] == PLACE_HOLDER_CALL_START ) {

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
            throw new Error( getSyntaxError("Expect a '" + getOpposite( stack[ stack.length - 1 ]['char'] ) + "'", i - 1) );
        }

    };

    function getShorthandDigit(deadDigit){
        return function(input) {
            return pfDigit(input, deadDigit+"");       
        };
    }

    /* Public Methods */

    function Ctor ( pattern, config ) {

        // a list of items to be matched
        this.config = boeClone.call(defaultSettings, true);
        boeUtil.mixin( this.config, config );
        this.items = [];
        this.pattern = pattern;
        this.type = TYPE_POSITIVE;
        this._query = null;
        parse.call(this, pattern);

    }

    var p = Ctor.prototype;

    /**
     * Return an object to decribe if string is matched or how many characters are matched
     */
    p.apply = function ( string, isFullyMatch ) {
        var i, len, input, items, matches = [], item, func, context,
            result = '', 
            curChar,
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

        if ( util.hasBit( this.type , TYPE_NEGATIVE ) ) {
            // compulsory set it if current pattern is negative one
            isFullyMatch = true;
        }

        if ( isFullyMatch ) {
            len = matches.length;
        }
        else {
            len = input.length;
        }

        if ( string.length > matches.length ) {
            matched = false;
        }

        // check if matching
        for ( i = 0; i < len && i < matches.length ; i++ ) {

            item = matches[ i ];
            curChar = input.charAt( i );

            if ( item.type == MODE_FUNCTION ) {

                func = Ctor.functions[ item.value ];

                if ( func == null ) {
                    throw new Error( getRuntimeError( 'Function "' + item.value + '"" was not available.', i ) );
                }

                context = {
                    pattern: this,
                    index: i, 
                    prev: input.charAt( i - 1 ),
                    input: input
                };

                try {
                    if ( func.call( null, curChar, item.param, context) === false ) {
                        matched = false;
                        break;
                    }
                }
                catch(ex){
                    throw new Error( getRuntimeError( ex.message, i ) );
                }
                

                matchedCount++;

                item.value = curChar;
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
                result += this.config.placeholder.empty;
            }
        }

        return { 
            // the actual string after applied the pattern
            result: result, 
            // indicate if application is successful
            matched: matched, 
            legitimate: util.hasBit( this.type, TYPE_POSITIVE ) ? matched : !matched ,
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
        if ( str.length > this.items.length ) {
            throw EX_NOT_FORMATTED;
        }

        var ret = [], item, items = this.items, func, context, curChar, prevInput = '', index = 0;

        ret.toString = function () {
            return this.join('');
        };

        for( var i = 0; i < str.length ; i++ ) {
            item = items[i];
            curChar = str.charAt(i);

            if ( item.type == MODE_FUNCTION ) {
                func = Ctor.functions[item.value];

                if ( func == null ) {
                    throw EX_NOT_FORMATTED;
                }

                if ( curChar == this.config.placeholder.empty ) {
                    // skip it as it is a placeholder
                    continue;
                }

                context = {
                    pattern: this,
                    index: index,
                    prev: prevInput,
                    input: ret + curChar
                };

                if ( func.call( null, curChar, item.param, context ) == false ) {
                    throw EX_NOT_FORMATTED;
                }

                ret.push( { 
                    result: curChar,
                    index: {
                        formatted: i,
                        original: ret.length
                    },
                    toString: resultToString
                });

                prevInput = curChar;
                index++;
            }
            else if ( item.type == MODE_CONSTANT ) {
                if ( curChar != item.value ) {
                    throw EX_NOT_FORMATTED;
                }
            }
            else {
                throw EX_NOT_FORMATTED;
            }
        }

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
        'd': pfDigit,
        'a': pfAlphabet,
        'x': pfDuplicate,
        'n': pfNever,
        '?': function(curChar, param, context){
            return pfDuplicate.call(this, curChar, '?', context)
        },
        '*': pfEverything,
        'l': pfLuhn,
        'L': function(curChar, param, context){
            return !pfLuhn.call(this, curChar, param, context)
        }
    };

    for ( var i = 10; i--; ) {
        Ctor.functions[i] = getShorthandDigit(i);
    }

    Ctor.parse = function( str, config ) {
        var ret = new Ctor( str, config );
        return ret;
    };

    return Ctor;
});