
//>>excludeStart("release", pragmas.release);
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}
//>>excludeEnd("release");

define([
    './PatternConstant', 
    './util',
    '../lib/boe/src/boe/String/trimLeft',
    '../lib/boe/src/boe/String/trimRight'
    //>>excludeStart("release", pragmas.release);
    , './shim/console'
    //>>excludeEnd("release");
], function (
    PatternConstant,
    util,
    boeTrimLeft,
    boeTrimRight
    //>>excludeStart("release", pragmas.release);
    ,console
    //>>excludeEnd("release");
    ) {

    var EX_NO_PATTERN = 'No pattern specified';

    /* Private */
    function format( ) {
        // pick the input, apply the first hit pattern

        var pattern, 
            matched = false,
            cache = this._cache,
            resultObject,
            bestMatchResultObject,
            bestMatchPattern,
            skip = false;

        //>>excludeStart("release", pragmas.release);
        console.log('Start negative patterns matching with input: "' + cache + '"');
        //>>excludeEnd("release");

        for( var i = 0; i < this.patterns.length; i++ ) {
            pattern = this.patterns[ i ];
            if ( 
                util.hasBit( pattern.type , PatternConstant.TYPE_POSITIVE ) ||
                util.hasBit( pattern.type , PatternConstant.TYPE_PASSIVE ) 
            ) { continue; }

            //>>excludeStart("release", pragmas.release);
            console.log('  ', pattern + '', pattern.type);
            //>>excludeEnd("release");

            if ( resultObject = pattern.apply( cache ) ) {
                if ( resultObject.matched ) {
                    bestMatchPattern = pattern;
                    bestMatchResultObject = resultObject;
                    skip = true;
                    break;
                }
            }
        }

        //>>excludeStart("release", pragmas.release);
        console.log('Start Formating: "' + cache + '"');
        //>>excludeEnd("release");

        for( var i = 0; i < this.patterns.length && skip == false; i++ ) {
            pattern = this.patterns[ i ];
            if ( 
                util.hasBit( pattern.type, PatternConstant.TYPE_NEGATIVE )
            ) { continue; }
            if ( resultObject = pattern.apply( cache ) ) {
                //>>excludeStart("release", pragmas.release);
                console.log('  ', pattern + '', pattern.type, resultObject.counts);
                //>>excludeEnd("release");
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
            //>>excludeStart("release", pragmas.release);
            console.log( 'Best Matching Pattern: ', bestMatchPattern.toString(), bestMatchResultObject)
            //>>excludeEnd("release");

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
        var ret = null,
            extraction,
            curPattern;

        if ( this._current && this._current.pattern ) {
            try{
                ret = this._current.pattern.extract( formatted );
                ret.pattern = this._current.pattern;
            }
            catch(ex){
                //>>excludeStart("release", pragmas.release);
                console.log('Best bet extraction failed, will try the others...');
                //>>excludeEnd("release");
            }
        }

        // try to find out best extraction
        for( var l = this.patterns.length; l--; ) {

            curPattern = this.patterns[l];
            
            if ( util.hasBit( curPattern.type , PatternConstant.TYPE_NEGATIVE ) ) {
                continue;
            }

            try{
                extraction = curPattern.extract( boeTrimLeft.call( boeTrimRight.call(formatted, curPattern.config.placeholder.empty), curPattern.config.placeholder.empty) );
            }
            catch(ex) {
                continue;
            }

            if ( ret == null || extraction.length > ret.length ) {
                ret = extraction;
                ret.pattern = curPattern;
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
    };

    p.isIntact = function( input ){
        var pttn;
        // check against passive
        for( var l = this.patterns.length; l--; ) {
            pttn = this.patterns[l];
            if ( !util.hasBit( pttn.type, PatternConstant.TYPE_PASSIVE ) ) {
                continue;
            }
            result = pttn.apply( input );
            if ( result.legitimate == false ) {
                return false;
            }
        }

        // check against all positive 
        for( var l = this.patterns.length; l--; ) {
            pttn = this.patterns[l];
            if ( !util.hasBit( pttn.type, PatternConstant.TYPE_POSITIVE ) ) {
                continue;
            }
            result = pttn.apply( input, true );
            if ( result.legitimate == true ) {
                return true;
            }
        }

        return false;
    }

    return Ctor;
});