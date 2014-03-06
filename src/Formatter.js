
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}

define(['./shim/console', '../lib/boe/src/boe/String/trim'], function (console, trim) {

    var EX_NO_PATTERN = 'No pattern specified';

    /* Private */
    function format( ) {
        // pick the input, apply the first hit pattern

        var pattern, 
            matched = false,
            cache = this._cache,
            resultObject,
            bestMatchResultObject,
            bestMatchPattern;

        console.log('Start Formating: "' + cache + '"');

        for( var i = 0; i < this.patterns.length; i++ ) {
            pattern = this.patterns[ i ];
            if ( resultObject = pattern.apply( cache ) ) {
                console.log('  ', pattern + '', resultObject.counts);
                if ( resultObject.matched ) {
                    bestMatchResultObject = resultObject;
                    bestMatchPattern = pattern;
                    matched = true;
                    break;
                }
                else if ( 
                    bestMatchResultObject == null || 
                    resultObject.counts.matched > bestMatchResultObject.counts.matched ) {
                    bestMatchResultObject = resultObject;
                    bestMatchPattern = pattern;
                }
            }
        }

        if ( bestMatchPattern != null && bestMatchResultObject ) {

            console.log( 'Best Matching Pattern: ', bestMatchPattern.toString(), bestMatchResultObject)

            this._current = { 
                pattern: bestMatchPattern,
                result: bestMatchResultObject,
                input: cache
            };

            return this._current;
        }
        else {
            return null;
        }
    }

    /* Public */

    function Ctor( patterns ) {
        if ( patterns == null || (patterns.length >>> 0) <= 0 ) {
            throw EX_NO_PATTERN;
        }

        this._cache = '';
        this._current = null;
        this.patterns = patterns;
        this._undo = [];
    }

    var p = Ctor.prototype;

    /**
     * handle user input
     * @param input {
            key: this._keyCode,
            char: this._charCode,
            del: util.isDelKey( this._keyCode ),
            back: util.isBackSpaceKey( this._keyCode ),
            caret: this._caret
        }
     */
    p.input = function( input ) {
        var cache = this._cache, caret, injection = '';

        if ( typeof input == 'string' ) {
            input = {
                'key': 0,
                'char': input.charCodeAt(0),
                'del': false,
                'back': false,
                'caret': { begin: cache.length, end: cache.length }
            };
        }

        caret = {
            begin: input.caret.begin,
            end: input.caret.end
        };

        if ( input.caret.begin == input.caret.end ) {
            if ( input.del ) {
                caret.end += 1;
            }
            else if ( input.back ) {
                caret.begin -= 1;
            }   
        }
        
        if ( input['char'] != null ) {

            injection = String.fromCharCode( input['char'] );

        }

        cache = 
            cache.substring( 0, caret.begin ) + injection +
            cache.substring( caret.end , cache.length);

        this._undo.push( this._cache );
        this._cache = cache;

    };

    p.output = function() {
        return format.call( this );
    };

    p.undo = function() {
        if ( this._undo.length <= 0 ) {
            return null;
        }
        this._cache = this._undo.pop();
        return format.call( this );
    };

    /**
     * Remove the format and return the actual user data according to current pattern
     */
    p.extract = function( formatted ) {
        var ret = '',
            extraction;

        if ( this._current && this._current.pattern ) {
            ret = this._current.pattern.extract( formatted );    
        }

        // try to find out best extraction
        for( var l = this.patterns.length; l--; ) {
            try{
                extraction = this.patterns[l].extract( trim.call(formatted) );
            }
            catch(ex) {
                continue;
            }

            if ( extraction.length > ret.length ) {
                ret = extraction
            }
        }

        return ret;
    };

    p.index = function ( ) {
        return this._current.pattern.index();
    };

    p.reset = function(cache){
        if ( cache == null ) {
            cache = '';
        }

        this._undo.push( this._cache );
        this._cache = cache;
        this._current = null;
        return format.call( this );
    }

    return Ctor;
});