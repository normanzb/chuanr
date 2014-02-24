
if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function () {

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

        console.log('input', cache);

        for( var i = 0; i < this.patterns.length; i++ ) {
            pattern = this.patterns[ i ];
            if ( resultObject = pattern.match( cache ) ) {
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
            console.log( bestMatchPattern.toString(), bestMatchResultObject)
            this._current = { 
                pattern: bestMatchPattern,
                result: bestMatchResultObject
            };

            return bestMatchResultObject.result;
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
        var cache = this._cache;

        var caret = {
            begin: input.caret.begin,
            end: input.caret.end
        };
        var injection = '';

        if ( input.caret.begin == input.caret.end ) {
            if ( input.del ) {
                caret.end += 1;
            }
            else if ( input.back ) {
                caret.begin -= 1;
            }   
        }
        
        if ( input.char != null ) {

            injection = String.fromCharCode( input.char );

        }

        cache = 
            cache.substring( 0, caret.begin ) + injection +
            cache.substring( caret.end , cache.length);

        this._cache = cache;

    };

    p.output = function() {
        return format.call( this );
    };

    return Ctor;
});