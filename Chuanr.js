(function() { 
var global = new Function('return this')();var myDefine = (function(factory){ var ret = factory();typeof module != 'undefined' && (module.exports = ret);global.define && global.define(function(){return ret;});global.Chuanr = ret; });var require, define;
(function (undef) {
    var mod = {}, g = this;
    function resolvePath(base, relative){
        var ret, upCount = 0, l;

        base = base.split('/');
        relative = relative.split('/');
        if ( relative[0] == '.' || relative[0] == '..' ) {
            base.pop();
            ret = base.concat(relative);
        }
        else {
            ret = relative;
        }

        for(l = ret.length ; l--; ){
            if ( ret[l] == '.' ) {
                ret.splice( l, 1 );
            }
            else if ( ret[l] == '..' ) {
                upCount++;
            }
            else {
                if ( upCount > 0 ) {
                    ret.splice( l, 2 );
                    upCount--;
                }
            }
        }
        return ret.join('/');
    }
    define = function( id, deps, factory ){
        mod[id] = {
            p: id,
            d: deps,
            f: factory
        };
    };
    define.amd = true;
    require = function(deps, factory){
        var module = this;
        var resolved = [], cur, relative, absolute;

        if ( module == null || module === g ) {
            module = { p: '_NE_' };
        }

        if ( typeof deps == 'string' && factory == null ) {
            deps = [deps];
        }

        for(var i = 0; i < deps.length; i++) {
            relative = deps[i];
            absolute = resolvePath( module.p, relative );
            if ( absolute == "require" ) {
                cur = {
                    p: '_NE_',
                    d: [],
                    f: function(){ return require }
                };
            }
            else {
                cur = mod[absolute];
            }
            if ( !cur ) {throw "module not found"}
            resolved.push( require.call( cur, cur.d, cur.f ) );
        }

        resolved.push(require, {});
        if ( factory ) {
            return factory.apply(g, resolved);
        }
        else {
            return resolved[0];
        }
    };
}());
define("../lib/amdshim/amdshim", function(){});


define('PatternConstant',[],function(){
    return {
        MODE_CONSTANT : 1,
        MODE_FUNCTION : 2,
        MODE_PARAMETER : 4,
        TYPE_POSITIVE : 0,
        TYPE_NEGATIVE : 1,
        TYPE_REGEXP : 2,
        TYPE_PASSIVE : 4
    };
});
/**
 * Modified based on util.js in https://github.com/firstopinion/formatter.js
 */

define('util',[],function(){

    var util = {};

    // Useragent info for keycode handling
    var uAgent = (typeof navigator !== 'undefined') ? navigator.userAgent : null,
        iPhone = /iphone/i.test(uAgent);

    //
    // Helper method for cross browser event listeners
    //
    util.addListener = function (el, evt, handler) {
        return (el.addEventListener)
            ? el.addEventListener(evt, handler, false)
            : el.attachEvent('on' + evt, handler);
    };
    util.removeListener = function (el, evt, handler) {
        return (el.removeEventListener)
            ? el.removeEventListener(evt, handler, false)
            : el.detachEvent('on' + evt, handler);
    };

    //
    // Helper method for cross browser implementation of preventDefault
    //
    util.preventDefault = function (evt) {
        return (evt.preventDefault) ? evt.preventDefault() : (evt.returnValue = false);
    };

    //
    // Returns true/false if k is a del key
    //
    util.isDelKey = function (k) {
        return k === 46 || (iPhone && k === 127);
    };

    //
    // Returns true/false if k is a backspace key
    //
    util.isBackSpaceKey = function (k) {
        return k === 8;
    }

    //
    // Returns true/false if k is an arrow key
    //
    util.isSpecialKey = function (k) {
        var codes = {
            '9' : 'tab',
            '13': 'enter',
            '35': 'end',
            '36': 'home',
            '37': 'leftarrow',
            '38': 'uparrow',
            '39': 'rightarrow',
            '40': 'downarrow',
            '116': 'F5'
        };
        // If del or special key
        return codes[k];
    };

    //
    // Returns true/false if modifier key is held down
    //
    util.isModifier = function (evt) {
        return evt.ctrlKey || evt.altKey || evt.metaKey;
    };

    util.isMovementKeyCode = function( k ) {

        // 35 and 36 is Home and End
        if ( 
            k >= 35 && k <= 40 || k == 9
        ) {
            return true;
        }

        return false;

    };

    util.hasBit = function (who, what ) {
        if ( what == 0 ) {
            return ( who & 1 ) != 1;
        }
        return ( who & what ) == what;
        
    };

    return util;
});
define('../lib/boe/src/boe/util',[],function(){
    
    
    var global = (Function("return this"))();

    var OBJECT_PROTO = global.Object.prototype;
    var ARRAY_PROTO = global.Array.prototype;
    var FUNCTION_PROTO = global.Function.prototype;
    var FUNCTION = 'function';

    var ret = {
        mixinAsStatic: function(target, fn){
            for(var key in fn){
                if (!fn.hasOwnProperty(key)){
                    continue;
                }

                target[key] = ret.bind.call(FUNCTION_PROTO.call, fn[key]);
            }

            return target;
        },
        type: function(obj){
            var typ = OBJECT_PROTO.toString.call(obj);
            var closingIndex = typ.indexOf(']');
            return typ.substring(8, closingIndex);
        },
        mixin: function(target, source, map){

            // in case only source specified
            if (source == null){
                source = target;
                target= {};
            }

            for(var key in source){
                if (!source.hasOwnProperty(key)){
                    continue;
                }

                target[key] = ( typeof map == FUNCTION ? map( key, source[key] ) : source[key] );
            }

            return target;
        },
        bind: function(context) {
            var slice = ARRAY_PROTO.slice;
            var __method = this, args = slice.call(arguments);
            args.shift();
            return function wrapper() {
                if (this instanceof wrapper){
                    context = this;
                }
                return __method.apply(context, args.concat(slice.call(arguments)));
            };
        },
        slice: function(arr) {
            return ARRAY_PROTO.slice.call(arr);
        },
        g: global
    };

    return ret;
});
/*
 * Trim specified chars at the start of current string.
 * @member String.prototype
 * @return {String} trimed string
 */
define('../lib/boe/src/boe/String/trimLeft',['../util'], function (util) {
    return function( trimChar ) {
        var hex;
        if ( util.type(trimChar) == 'String' ) {
            hex = trimChar.charCodeAt(0).toString(16);
            trimChar = hex.length <= 2 ? '\\x' + hex : '\\u' + hex;
        }
        else if ( trimChar instanceof RegExp ) {
            // leave it as is
        }
        else {
            trimChar = '\\s';
        }
        var re = new RegExp('(^' + trimChar + '*)', 'g');
        return this.replace(re, "");
    };
});
/*
 * Trim specified chars at the end of current string.
 * @member String.prototype
 * @return {String} trimed string
 */
define('../lib/boe/src/boe/String/trimRight',['../util'], function (util) {
    return function( trimChar ) {
        var hex;
        if ( util.type(trimChar) == 'String' ) {
            hex = trimChar.charCodeAt(0).toString(16);
            trimChar = hex.length <= 2 ? '\\x' + hex : '\\u' + hex;
        }
        else if ( trimChar instanceof RegExp ) {
            // leave it as is
        }
        else {
            trimChar = '\\s';
        }
        var re = new RegExp('(' + trimChar + '*$)', 'g');
        return this.replace(re, "");
    };
});


define('Formatter',[
    './PatternConstant', 
    './util',
    '../lib/boe/src/boe/String/trimLeft',
    '../lib/boe/src/boe/String/trimRight'
    ], function (
    PatternConstant,
    util,
    boeTrimLeft,
    boeTrimRight
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

        
        for( var i = 0; i < this.patterns.length; i++ ) {
            pattern = this.patterns[ i ];
            if ( 
                util.hasBit( pattern.type , PatternConstant.TYPE_POSITIVE ) ||
                util.hasBit( pattern.type , PatternConstant.TYPE_PASSIVE ) 
            ) { continue; }

            
            if ( resultObject = pattern.apply( cache ) ) {
                if ( resultObject.matched ) {
                                        bestMatchPattern = pattern;
                    bestMatchResultObject = resultObject;
                    skip = true;
                    break;
                }
            }
        }
        
        
        for( var i = 0; i < this.patterns.length && skip === false; i++ ) {
            pattern = this.patterns[ i ];
            if ( 
                util.hasBit( pattern.type, PatternConstant.TYPE_NEGATIVE )
            ) { continue; }
            if ( resultObject = pattern.apply( cache ) ) {
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

        if ( bestMatchPattern && bestMatchResultObject ) {
            
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
        var pttn, hasPositive = false;

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
            hasPositive = true;
            result = pttn.apply( input, true );
            if ( result.legitimate == true ) {
                return true;
            }
        }

        return !hasPositive ;
    }

    return Ctor;
});

define( 'PatternFunction/digit',[],function () {

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

    var ret = function(curChar, param, context){

        if ( param == '?' ) {
            if ( curChar == '' || curChar === context.pattern.config.placeholder.empty ) {
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
                return curChar == context.prev;
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

                return curChar == ( context.prev * 1 + ( param >> 0 ) );
            }
        }

        if ( param == null || (param == 0 && param !== '0') ) {
            param = "0-9";
        }

        if ( regexAcceptableParam.test( param ) ) {
            throw new Error( EX_NOT_CORRECT_PARAM );
        }
        
        return new RegExp("^[" + param + "]$").test( curChar );
    };

    return ret;
});

define( 'PatternFunction/alphabet',[],function () {

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

    var ret = function(curChar, param, context){

        if ( param == '?' ) {
            if ( curChar == '' || curChar == ' ') {
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
                return curChar == context.prev;
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

                return curChar.charCodeAt(0) == ( context.prev * 1 + ( param >> 0 ) ).charCodeAt(0);
            }
        }

        if ( param == null || (param == 0 && param !== '0') ) {
            param = AZAZ;
        }

        if ( regexAcceptableParam.test( param ) ) {
            throw new Error( EX_NOT_CORRECT_PARAM );
        }
        
        return new RegExp("^[" + param + "]$").test( curChar );
    };

    return ret;
});
define( 'PatternFunction/duplicate',[],function () {
    var ret = function(curChar, param, context){
        var index = context.index >>> 0;
        var target = index;
        var items = context.pattern.items;
        var prevItem;
        var prevFunc;
        var matches = [];
        var curFunc;

        if ( param == '?' && curChar == '') {
            return true;
        }

        for(var l = items.length;l--; ){
            if ( items[l].type == 2 ) {
                matches.unshift(items[l]);
            }
        }

        for(var l = matches.length;l--; ){
            prevItem = matches[l];
            if ( l == index ) {
                curFunc = context.pattern.constructor.functions[prevItem.value];
            }
            if ( l == target - 1 ) {
                prevFunc = context.pattern.constructor.functions[prevItem.value];
                if ( curFunc !== prevFunc ) {
                    break;
                }
                else {
                    target--;
                }
            }
        }

        if ( prevFunc == null || curFunc == prevFunc ) {
            throw new Error("No previous function");
        }

        var newContext = {};

        for(var key in context) {
            if ( !context.hasOwnProperty(key) ) {
                continue;
            }
            newContext[key] = context[key];
        }

        newContext.index = l;

        return prevFunc.call( this, curChar, prevItem.param, newContext );
    };

    return ret;
});
define( 'PatternFunction/never',[],function duplicate() {
    var ret = function(curChar, param, context){
        if ( param == '' || param == null || 
            curChar === '' || 
            curChar === context.pattern.config.placeholder.empty ){
            return false;
        }

        if ( param == '=' ) {
            return !(context.prev === curChar);
        }

        return !(curChar === param);
    };

    return ret;
});
define( 'PatternFunction/everything',[],function () {
    return function(curChar, param, context){
        if ( param == null || param == '' || param == false ) {
            return true;    
        }
        
        return new RegExp("^[" + param + "]$").test( curChar );
    };
});
define( 'PatternFunction/luhn',['./digit'], function ( digit ) {
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
    
define('../lib/boe/src/boe/Object/clone',['../util'], function(util){

    var FUNCTION = 'function';
    var OBJECT = 'object';
    var FUNCTION_PROTO = util.g.Function.prototype;

    var objectCache = [];
    var traverseMark = '__boeObjectClone_Traversed';

    function boeObjectClone( deep ){
        var ret,
            obj = this;

        if ( traverseMark in this ) {
            // current object is already traversed
            // no need to clone, return the clone directly
            return this[traverseMark];
        }

        // push to stack
        objectCache.push( this );

        // clone starts
        if (typeof this == FUNCTION) {
            ret = window.eval("true?(" + FUNCTION_PROTO.toString.call(this) + "):false");
        }
        else if (util.type(this) == "Array") {
            ret = [];
        }
        else {
            ret = {};
        }

        this[traverseMark] = ret;

        for( var key in this ) {

            if ( this.hasOwnProperty(key) == false || key == traverseMark ) {
                // if it is the traverseMark on the proto, skip it
                continue;
            }

            var cur = this[key];

            if ( deep && (typeof cur == OBJECT || typeof cur == FUNCTION) ) {
                ret[key] = boeObjectClone.call( cur, deep );
            }
            else {
                ret[key] = cur;
            }
        }

        // clone ends

        if ( objectCache.pop( ) != this ) {
            throw "boe.Object.shadow: stack corrupted."
        }

        delete this[traverseMark];

        return ret;
    };

    return boeObjectClone;
});

define('PatternIndexQuery',['./PatternConstant'], function ( PatternConstant ) {

    var MODE_CONSTANT = PatternConstant.MODE_CONSTANT;
    var MODE_FUNCTION = PatternConstant.MODE_FUNCTION;
    var MODE_PARAMETER = PatternConstant.MODE_PARAMETER;
    
    var EX_ARG = 'Parameter not acceptable.';

    function getIndex() {
        var query = this._query;
        var targetName = this._target;
        var funcIndex, item, items = this._pattern.items, lastIndex;

        if ( query == null || targetName == null ) {
            return this;
        }

        if ( query['function'] && query['function'].index != null && targetName == "pattern" ) {
            funcIndex = -1

            for ( var i = 0 ; i < items.length; i++ ) {
                item = items[i];
                if ( item.type == MODE_FUNCTION ) {
                    funcIndex++;
                    lastIndex = i;
                    if ( funcIndex ==  query['function'].index ) {
                        return i;
                    }
                }
            }

            if ( query['function'].index == funcIndex + 1 ) {
                return lastIndex + 1;
            }

            return -1;
        }
        else if ( query.pattern && query.pattern.index != null && targetName == "function" ) {
            funcIndex = 0;

            if ( query.pattern.index < 0 ) {
                return -1;
            }

            for ( var i = 0 ; i < items.length && query.pattern.index > 0 ; i++ ) {

                item = items[i];

                if ( item.type == MODE_FUNCTION ) {
                    funcIndex++;
                }

                if ( i != query.pattern.index - 1 ) {
                    continue;
                }

                return funcIndex;
                
            }

            return funcIndex;
        }
        else {
            throw EX_ARG;
        }
    }

    function Ctor ( pattern ) {
        this._pattern = pattern;
        this._target = "pattern";
    }

    var p = Ctor.prototype;

    p.by = function(query) {
        this._query = query;

        return getIndex.call(this);
    };

    p.of = function(targetName) {
        this._target = targetName;

        return this;
    };

    return Ctor;
});
/* Pattern */

define('Pattern',[
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
    var TYPE_REGEXP = PatternConstant.TYPE_REGEXP;
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
                    me.type |= TYPE_REGEXP;
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
/*
 * caret.js
 *
 * Cross browser implementation to get and set input selections
 * Modified based on inptSel.js in https://github.com/firstopinion/formatter.js
 */
define('caret',[],function () {

    var inptSel = {};

    //
    // Get begin and end positions of selected input. Return 0's
    // if there is no selectiion data
    //
    inptSel.get = function (el) {
        // If normal browser return with result
        if (typeof el.selectionStart == "number") {
            return { 
              begin: el.selectionStart,
              end: el.selectionEnd
            };
        }

        // Uh-Oh. We must be IE. Fun with TextRange!!
        var range = document.selection.createRange();
        // Determine if there is a selection
        if (range && range.parentElement() == el) {
            var inputRange = el.createTextRange(),
                endRange   = el.createTextRange(),
                length     = el.value.length;

            // Create a working TextRange for the input selection
            inputRange.moveToBookmark(range.getBookmark());

            // Move endRange begin pos to end pos (hence endRange)
            endRange.collapse(false);
            
            // If we are at the very end of the input, begin and end
            // must both be the length of the el.value
            if (inputRange.compareEndPoints("StartToEnd", endRange) > -1) {
                return { begin: length, end: length };
            }

            // Note: moveStart usually returns the units moved, which 
            // one may think is -length, however, it will stop when it
            // gets to the begin of the range, thus giving us the
            // negative value of the pos.
            return {
                begin: -inputRange.moveStart("character", -length),
                end: -inputRange.moveEnd("character", -length)
            };
        }

        //Return 0's on no selection data
        return { begin: 0, end: 0 };
    };

    //
    // Set the caret position at a specified location
    //
    inptSel.set = function (el, pos) {
        // If normal browser
        if (el.setSelectionRange) {
            el.focus();
            el.setSelectionRange(pos,pos);

        // IE = TextRange fun
        } else if (el.createTextRange) {
            var range = el.createTextRange();
            range.collapse(true);
            range.moveEnd('character', pos);
            range.moveStart('character', pos);
            range.select();
        }
    };

    return inptSel;
});

define('differ',[],function () {
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
/*
 * Function.bind
 */
define('../lib/boe/src/boe/Function/bind',['../util'], function (util) {
    // simply alias it
    var FUNCTION_PROTO = util.g.Function.prototype;

    return FUNCTION_PROTO.bind || util.bind;
});
/*
 * Trim specified chars at the start and the end of current string.
 * @member String.prototype
 * @return {String} trimed string
 * @es5
 */
define('../lib/boe/src/boe/String/trim',['../util', './trimLeft', './trimRight'], function (util, trimLeft, trimRight) {
    var STRING_PROTO = util.g.String.prototype;
    return STRING_PROTO.trim || function() {
        var ret = trimLeft.call( this );
        ret = trimRight.call( ret );
        return ret;
    };
});
define('../lib/cogs/src/cogs/noop',[],function(){
    return function(){};
});
/**
 * @function: observable
 **/


define('../lib/cogs/src/cogs/observable',['./noop'], function (noop) {

    function EventLinkBox(){
        this.ref = null;
        this.next = null;
    }

    /**
     * @function newBox
     * @private
     * Create a node
     **/
    function newBox() {
        return new EventLinkBox;
    };

    function checkIsFunc(func){
        if (Object.prototype.toString.call(func).toLowerCase() !==
            '[object function]'){
            throw new Error('hookee is not a function');
        }
    };

    function hookFunc(func){
        checkIsFunc(func);

        this.cur.next = newBox();

        this.cur = this.cur.next;
        this.cur.ref = func;

        return true;
    };

    function unhookFunc(func){
        checkIsFunc(func);

        // traversing link ds
        var c = this.head;
        var p = null;
        while (c.next != null) {
            p = c;
            c = c.next;
            if (c.ref === func || 
                // allow to remove all hooked functions when func is mot specified
                func == null) {
                p.next = c.next;

                // we are deleting the last element
                if (c.next == null){
                    // reset this.cur
                    this.cur = p;
                }

                c.ref = null;
                return true;
            }
        }

        return false;
    };

    function hookOnceFunc(func){
        var scope = this;
        var funcWrapper = function(){
            unhookFunc.call(scope, funcWrapper);
            func.apply(this, arguments);
        };

        hookFunc.call(scope, funcWrapper);
    };

    function invokeFunc(){
        var args = Array.prototype.slice.call(arguments, 1);
        var context = arguments[0];
        var c = this.head;
        var p = null, tmp = null, result=null;
        while (c.next != null) {
            p = c;
            c = c.next;
            if (c.ref != null) {

                tmp = null;
                try {
                    tmp = c.ref.apply(context, args);
                }
                catch (ex) {
                    // we need to throw the exception but meanwhile keep 
                    // casting. so we decided to throw in another ui task
                    // the advantage are:
                    //  1. it is more synmatically correct, an inner exception
                    //      should be thrown rather than console.error()
                    //  2. it also developer to determine the issue more easily
                    //      and ealier on IEs (while the other browsers hide the
                    //      js err) 
                    //  3. you can catch the error on window.onerror and process
                    setTimeout(function(){
                        throw ex;
                    }, 0); 
                }
                if (tmp != null) {
                    result = tmp;
                }
            }
        }

        return result;
    };

    function observable(retFunc) {

        var result = null;
        var ret = retFunc?retFunc:function(){
            return ret.invoke.apply(this, arguments);
        };

        ret.head = newBox();

        // init head node
        ret.head.ref = noop;

        // point cursor to head
        ret.cur = ret.head;

        // hook a func
        ret.hook = hookFunc;

        // hook func and unhook it once it is been called.
        ret.once = hookOnceFunc;

        // unhook a func
        ret.unhook = unhookFunc;

        // make sure the context of hookees are same as 
        // the context when ret.invoke is executed.
        ret.invoke = function(){
            var args = Array.prototype.slice.call(arguments);
            args.unshift(this);
            invokeFunc.apply(ret, args);
        };

        return ret;
    };

    observable.EventLinkBox = EventLinkBox;

    return observable;
});
/**
 * @function: event
 * Create a event-like delegate object, supports multicast

 * sample:
 * Create a observable object:
 * obj.onMouseDown = cogs.event();
 *
 * sample:
 * Hook a function to the event:
 * Obj.onMouseDown.hook(function(){});
 *
 * sample:
 * Remove a function reference from the event:
 * Obj.onMouseDown.unhook(funcVariable);
 *
 * sample:
 * Cast the event
 * onMouseDown(arg1, arg2);
 *
 **/


define('../lib/cogs/src/cogs/event',['./observable'], function(observable){
    var ON = 'on';

    function event(){
        var ret = observable();
        
        ret.onHook = observable();
        ret.onUnhook = observable();

        var hook = ret.hook;
        var once = ret.once;
        ret.hook = function(func){
            if (ret.onHook(this, func) === false){
                return false;
            }
            return hook.apply(this, arguments);
        };

        ret.once = function(func){
            if (ret.onHook(this, func) === false){
                return false;
            }
            return once.apply(this, arguments);
        };

        var unhook = ret.unhook;
        ret.unhook = function(func){
            if (ret.onUnhook(this, func) === false){
                return false;
            }
            return unhook.apply(this, arguments);
        };

        return ret;
    };

    function onFunc(eventName, callback){
        var name = eventName.charAt(0).toUpperCase() + eventName.substr(1),
            evt = this[ON + name];

        if (!evt){
            evt = event();
            this[ON + name] = evt;
        }

        if (evt.hook){
            evt.hook(callback);
        }
        else{
            throw "The member name '" + eventName + "' is occupied.";
        }
    }

    function offFunc(eventName, callback){
        if (!eventName){
            
            // if there is no eventName specified, that simply means
            // we want to clear all event on current obj
            for(var key in this){
                if (key.indexOf(ON) != 0 ||
                    // if it is not a cogs event object
                    !(this[key].head instanceof observable.EventLinkBox)){
                    continue;
                }

                offFunc(key.substr(2));
            }

            return;
        }

        var name = eventName.charAt(0).toUpperCase() + eventName.substr(1),
            evt = this[ON + name];

        if (!evt){
            return;
        }

        if (evt.unhook){
            evt.unhook(callback);
        }
        else{
            throw "The member name '" + eventName + "' might be over written.";
        }
    }

    function emitFunc(eventName){
        var name = [eventName.charAt(0).toUpperCase(), eventName.substr(1)].join(''),
            evt = this[ON + name], args;

        if (evt){
            args = Array.prototype.slice.call(arguments, 1);
            evt.apply(this, args);
        }
    };

    event.onFunc = onFunc;
    event.offFunc = offFunc;
    event.emitFunc = emitFunc;

    return event;
});
/**
 * @function emittable
 * add .on and .off to support any object
 */ 


define('../lib/cogs/src/cogs/emittable',['./event'], function (event) {

    function emittable(obj){
        obj['on'] = event.onFunc;
        obj['off'] = event.offFunc;
        obj['emit'] = event.emitFunc;

        return obj;
    };

    emittable(emittable.prototype); 

    return emittable;
});
define('shim/../../lib/boe/src/boe/Function/../util',[],function(){
    
    
    var global = (Function("return this"))();

    var OBJECT_PROTO = global.Object.prototype;
    var ARRAY_PROTO = global.Array.prototype;
    var FUNCTION_PROTO = global.Function.prototype;
    var FUNCTION = 'function';

    var ret = {
        mixinAsStatic: function(target, fn){
            for(var key in fn){
                if (!fn.hasOwnProperty(key)){
                    continue;
                }

                target[key] = ret.bind.call(FUNCTION_PROTO.call, fn[key]);
            }

            return target;
        },
        type: function(obj){
            var typ = OBJECT_PROTO.toString.call(obj);
            var closingIndex = typ.indexOf(']');
            return typ.substring(8, closingIndex);
        },
        mixin: function(target, source, map){

            // in case only source specified
            if (source == null){
                source = target;
                target= {};
            }

            for(var key in source){
                if (!source.hasOwnProperty(key)){
                    continue;
                }

                target[key] = ( typeof map == FUNCTION ? map( key, source[key] ) : source[key] );
            }

            return target;
        },
        bind: function(context) {
            var slice = ARRAY_PROTO.slice;
            var __method = this, args = slice.call(arguments);
            args.shift();
            return function wrapper() {
                if (this instanceof wrapper){
                    context = this;
                }
                return __method.apply(context, args.concat(slice.call(arguments)));
            };
        },
        slice: function(arr) {
            return ARRAY_PROTO.slice.call(arr);
        },
        g: global
    };

    return ret;
});
/*
 * Function.bind
 */
define('shim/../../lib/boe/src/boe/Function/bind',['../util'], function (util) {
    // simply alias it
    var FUNCTION_PROTO = util.g.Function.prototype;

    return FUNCTION_PROTO.bind || util.bind;
});
define('shim/oninput',['../../lib/boe/src/boe/Function/bind'], function (bind) {
    

    var INPUT = 'input';
    var CHANGE = 'change';
    var PROPERTYNAME = 'propertyName';

    /* Feature Detection */

    var hasOnInput = function(){
        /*
            The following function tests an element for oninput support in Firefox.
            Many thanks to:
            http://blog.danielfriesen.name/2010/02/16/html5-browser-maze-oninput-support/
        */
        function checkEvent(el) {
            // First check, for if Firefox fixes its issue with el.oninput = function
            el.setAttribute('oninput', 'return');
            if (typeof el.oninput == 'function'){
                return true;
            }

            // Second check, because Firefox doesn't map oninput attribute to oninput property
            try {
                var e  = document.createEvent('KeyboardEvent'),
                    ok = false,
                    tester = function(e) {
                        ok = true;
                        e.preventDefault();
                        e.stopPropagation();
                    }
                e.initKeyEvent('keypress', true, true, window, false, false, false, false, 0, 'e'.charCodeAt(0));
                document.body.appendChild(el);
                el.addEventListener(INPUT, tester, false);
                el.focus();
                el.dispatchEvent(e);
                el.removeEventListener(INPUT, tester, false);
                document.body.removeChild(el);
                return ok;
            } catch(e) {}
        }

        var testee = document.createElement(INPUT);
        return 'oninput' in testee || checkEvent(testee);
    }();

    /* Private */

    function onchange( evt ){
        var me = this;
        
        if ( 
            PROPERTYNAME in window.event && 
            window.event[PROPERTYNAME] != null && 
            window.event[PROPERTYNAME] !== ''
        ) {
            if ( window.event[PROPERTYNAME] !== 'value') {
                return;
            }
        }
        
        if ( me._el.value != me._old ) {
            me._old = me._el.value;
            me.oninput( evt );
        }
    }

    function onfocus () {
        document.attachEvent('onselectionchange', this._onchange);
    }

    function onblur() {
        document.detachEvent('onselectionchange', this._onchange);
    }

    function oninput(){
        this.oninput();
    }

    /* Public */
    
    function Observer(){
        this._old = '';
        this._el = null;
        this._onchange = bind.call(onchange, this);
        this._onfocus = bind.call(onfocus, this);
        this._onblur = bind.call(onblur, this);
        this._oninput = bind.call(oninput, this);
        this.oninput = function(){};
    }

    var p = Observer.prototype;

    p.trigger = function () {
        return this._onchange();
    };

    p.sync = function () {
        this._old = this._el.value;
    };

    p.observe = function(el){
        if ( el == null || el.tagName.toLowerCase() != INPUT ) {
            throw 'Target input element must be specified.';
        }

        var me = this;
        me._el = el;

        // higher priority to use prooperty change
        // because IE9 oninput is not implemented correctly
        // when you do backspace it doesn't fire oninput
        if ( el.attachEvent ) {
            me._old = el.value;
            el.attachEvent('onpropertychange', me._onchange);
            el.attachEvent('onfocus', me._onfocus);
            el.attachEvent('onblur', me._onblur);
            // binding onkeypress to avoid https://gist.github.com/normanzb/137a8b9d0cf317a1be58
            el.attachEvent('onkeypress', me._onchange);
            el.attachEvent('onkeyup', me._onchange);
        }
        else if ( hasOnInput ) {
            el.addEventListener(INPUT, me._onchange, false);
            // monitor onchange event as well just in case chrome browser bugs:
            // https://code.google.com/p/chromium/issues/detail?id=353691
            el.addEventListener(CHANGE, me._onchange, false);
        }
        else {
            throw 'Something wrong, should never goes to here.';
        }
    };

    p.neglect = function (){
        var me = this;
        var el = me._el;

        if ( el.attachEvent ) {
            el.detachEvent('onpropertychange', me._onchange);
            el.detachEvent('onfocus', me._onfocus);
            el.detachEvent('onblur', me._onblur);
            el.detachEvent('onkeypress', me._onchange);
            el.detachEvent('onkeyup', me._onchange);
        }
        else {
            el.removeEventListener(INPUT, me._onchange);
            el.removeEventListener(CHANGE, me._onchange);
        }

    };

    p.dispose = function() {
        var me = this;
        me.neglect();
        me._el = null;
    };

    return Observer;

});


define('Chuanr',[
    './Formatter', 
    './Pattern', 
    './PatternConstant', 
    './util', 
    './caret', 
    './differ', 
    '../lib/boe/src/boe/Function/bind', 
    '../lib/boe/src/boe/String/trim', 
    '../lib/boe/src/boe/Object/clone', 
    '../lib/boe/src/boe/util', 
    '../lib/cogs/src/cogs/emittable',
    '../lib/cogs/src/cogs/event',
    './shim/oninput'
        ], 
    function ( 
        Formatter, 
        Pattern, 
        PatternConstant,
        util, caretUtil, differUtil,
        bind, trim, clone, boeUtil, 
        emittable, event, 
        InputObserver
             ) {

    // ioc settings
    var ioc = {
        Formatter: Formatter,
        Pattern: Pattern,
        InputObserver: InputObserver
    };

    var defaultSettings = {
        placeholder: {
            empty: ' ',
            always: false
        },
        speculation: {
            batchinput: true
        }
    };

    var lockFocus = false;

    /* Private Methods */
    function tryExtractAndResetCaret( value, caret ) {
        // do a filtering before actual inputting
        var original, extraction;

        try{
                        extraction = this.formatter.extract( value );
            if ( extraction != null ) {
                original = trim.call( extraction + '' );
                            }
        }
        catch(ex){
            original = null;
        }

        if ( original == null ) {
                    }

        if ( caret && original != null ){
            
            // calculate the original caret position
            caret.begin = this.formatter
                .index()
                    .of('function')
                    .by({ pattern: { index: caret.begin } });
            caret.end = this.formatter
                .index()
                    .of('function')
                    .by({ pattern: { index: caret.end } });

            // means actually at the end of input
            if ( caret.begin < 0 || caret.begin > original.length ) {
                caret.begin = original.length;
            }
            if ( caret.end < 0 || caret.end > original.length ) {
                caret.end = original.length;
            }

                    }

        if ( original == 0 ) {
            this._isFormatted = false;
        }

        return original;
    }

    function extraRawData( input, caret ){
        var prev, ret, prevInput, begin, end, isConstantDeletion = false,
            prefix, postfix, tmp;

        
        prev = this._untouched ? this._untouched.result + '' : '';

        differ = differUtil.diff(
            prev, 
            input
        );

        
        extraction = this.formatter.extract( prev );

        if ( extraction == null ) {
            ret = this.formatter.extract( input );
            return ret;
        }

        prevInput = extraction + '';

        isSpaceDeletion = differ.insertion.caret.begin == differ.insertion.caret.end &&
            (
                caret.begin < extraction.pattern.items.length &&
                extraction.pattern.items[caret.begin].type == PatternConstant.MODE_FUNCTION && 
                differ.deletion.text == this.config.placeholder.empty
            );

        isConstantDeletion = differ.insertion.caret.begin == differ.insertion.caret.end &&
            differ.deletion.text.length > 0 && 
            extraction.pattern.items[caret.begin].type == PatternConstant.MODE_CONSTANT;

        begin = extraction.pattern
            .index()
                .of('function')
                .by({ pattern: { index: differ.deletion.caret.begin }});
        end = extraction.pattern
            .index()
                .of('function')
                .by({ pattern: { index: differ.deletion.caret.end }})

        if ( isSpaceDeletion || isConstantDeletion ) {
            // quite possibly user deleted constant
                        begin = extraction.pattern
                .index().of('function').by({ pattern: { index: caret.begin }}) - (isConstantDeletion?1:0);
        }

        if ( begin > prevInput.length - 1 ) {
            begin = prevInput.length;
            end = begin;
        }

        prefix = prevInput.substring( 0, begin );
        postfix = prevInput.substring( end, prevInput.length + 1);

        input = prefix + differ.insertion.text + postfix;
            
        if ( caret != null ) {
            if ( isSpaceDeletion || isConstantDeletion ) {
                caret.begin = begin;
                caret.end = caret.begin;
                caret.type = 2;
            }
            else {
                tmp = end + differ.insertion.text.length - differ.deletion.text.length;
                if ( tmp >= 0 ) {
                    caret.begin = tmp
                    caret.end = tmp;
                    caret.type = 2;
                }
            }
        }

                ret = input;

        return ret;
    }

    function speculateBatchInput( input, format, caret ){

        var speculated, finalExtraction;

                speculated = tryExtractAndResetCaret.call( this, this._el.value, null );

        if ( speculated == null ) {

                        speculated = input.replace(/\W/g,'');

            if ( speculated != 0 ) {
                // caret type still unknown, a bit trick here
                // according to https://github.com/normanzb/chuanr/issues/11
                                differ = differUtil.diff(
                    this._untouched ? trim.call( this._untouched.result + '' ) : '', 
                    input
                );
                
                input = trim.call( speculated );
            }

            // give up
            
        }
        else {
                        input = trim.call( speculated );
            // can be extracted without problem mean the original string is formatted
            caret.type = 1;

        }
                return input;
    }

    function onKeyDown( evt ) {

        if ( this._requireHandleKeyUp == true && this._keyCode == evt.keyCode) {
            // mean user keeps key down 
            // this is not allowed because it causes oninput never happen
                        util.preventDefault(evt);
            return;
        }

    }

    function onInput( caretMode ) {
        
        if ( caretMode == null ) {
            caretMode = 1;
        }

        
        tryRender.call( this, caretMode );
    }

    function updateInput( result ){
        var me = this;
        var isEmpty = true;
        result = result + '';

        for(var l = result.length; l--; ) {
            if ( result.charAt(l) != this.config.placeholder.empty ) {
                isEmpty = false;
                break;
            }
        }

        if ( !isEmpty ) {
            if ( this._el.value != result ) {
                this._el.value = result;    
            }
            else {
                return true;
            }
        }
        else {
            this._el.value = '';
        }

        me.oninput.sync();
    }

    function tryRender(){
        var me = this;
        var ret;

        me.oninput.neglect();
        ret = render.apply(me, arguments);
        me.oninput.observe(me._el);

        return ret;
    }

    function createFakeFormat(input){
        var me = this;
        me._untouched = {
            result: input,
            toString: function() {
                return this.result;
            }
        };
    }

    /*
     * @caretMode - 0: skip setting caret
     *              1: automatically setting according to changes on the result
     *              2: compulsory to set it
     */
    function render( caretMode ) {
        var me = this;
        var caret = {
            begin: 0,
            end: 0,
            // Caret type only in batch mode
            // 0 == unknown, 
            // 1 == formatted (pattern index), 
            // 2 == extracted (function index)
            type: 0
        };
        var format;
        var undid = false;    
        var extracted;
        var input;

        // == Batch Input ==
        input = me._el.value;

        // 1. Initial Caret
        // the caret at the point could be with format or without
        // we will handle it later
        if ( lockFocus ) {
            caret = lockFocus;
        }
        else {
            caret = caretUtil.get( me._el );
        }
        caret.type = 1;

        // 2. Extract The Raw Input
        // Try to extract the raw data based on the format
        // that means the change is done by pasting, dragging ...etc
        extracted = extraRawData.call( me, input, caret );
        format = me.formatter.reset( extracted );

        if ( format && format.result.legitimate ) {
            input = extracted;
        }
        else if ( input != extracted ) {

            format = me.formatter.reset( input );

            if ( format && format.result.legitimate ) {
                if ( 
                    me._isFormatted == false && 
                    (
                        me._el.value != false ||
                        me._el.value === "0"
                    ) &&
                    caret.begin == 0
                ) {
                    // you must on ios 5, which sucks
                    caret.begin = trim.call( me._el.value ).length ;
                    caret.end = caret.begin;
                }
                // match immediately means user inputs raw numbers
                caret.type = 2;
            }
        }

        if ( format == null ) {
            // that probably means there is neither no pattern for formatting
            // ( user did not define a formatting (positive) pattern )
            // or no negative pattern matched
            createFakeFormat.call(me, input);

                        return;
        }

        if ( 
            format && format.result.legitimate == false &&
            me.config.speculation.batchinput == true 
        ) {
            // get a matched format by trying different type of input
            // also caret will be adjusted here
            input = speculateBatchInput.call( me, input, format, caret );
            format = me.formatter.reset( input );
        }

        // revert if match failed
        while ( format.result.legitimate == false ) {
            if ( undid == false ) {
                undid = format;
            }
            
            
            format = me.formatter.undo()

            if ( format == null ) {
                                updateInput.call( me, me._untouched && me._untouched.result || '' );
                break;
            }

            
            caret.begin = tryExtractAndResetCaret.call( me, format.result.toString(), null ).length;
            caret.end = caret.begin;
            caret.type = 2;
        }

        // same reason as the same check before, but this time it must at least matched negative 
        // pattern once
        if ( format == null ) {
            createFakeFormat.call(me, me._untouched && me._untouched.result || '');

                        return;
        }

        
        // record the final format
        me._untouched = format;
        // update the element
        var skipCaret = updateInput.call( me, format.result );

        if ( 
            ( caretMode == 1 && lockFocus != null && skipCaret !== true ) || 
            caretMode == 2 
        ) {
            // update the caret accordingly
            
            if ( caret.type === 2 ) {
                caret.begin = me.formatter
                    .index()
                        .of('pattern')
                        .by({ 'function': { index: caret.begin } });

            }
            else if ( caret.type === 1 ) {
                // set it to first slot that need to be inputted
                caret.begin = me.formatter
                    .index()
                        .of('pattern')
                        .by({ 'function': { index: format.input.length } });
            }
            
            lockFocus = caret;

            // set cursor
            caretUtil.set( me._el, caret.begin );

            // this is to prevent some iOS shits ( <= 6.0 ) to reset the caret after we set it
            // Caveat: check caretUtil.get( me._el ).begin != caret.begin doesnot work here
            // ios always return the correct caret at this time, it will update the caret to 
            // an incorrect one later... mobile safari sucks
            // TODO: use setImmediate shim to make it faster?
            setTimeout(function(){
                if ( caretUtil.get( me._el) != caret.begin ) {
                    // oh shit, we failed
                    caretUtil.set( me._el, caret.begin );
                }

                lockFocus = false;
            });
        }

        if ( format.result != 0 ) {
            me._isFormatted = true;
        }
        else {
            me._isFormatted = false;
        }

        // fire event
        if ( undid ) {
            me.onPrevented.invoke( undid );
        }
        else {
            me.onResumed.invoke( format );
        }

    }

    /* Public Methods */
    function Ctor( config ) {
        var me = this;
        me.patterns = [];
        me.passives = [];
        me.formatter = null;
        me.oninput = null;
        me.config = clone.call(defaultSettings, true);
        boeUtil.mixin( me.config, config, function( key, sourceValue ) {
            return boeUtil.mixin( me.config[key] || {}, sourceValue );
        } );

        me._el = null;
        me._untouched = null;
        me._isFormatted = false;

        me._onKeyDown = bind.call( onKeyDown, me );
        me._onFocus = bind.call( onInput, me, 2 );

        me.onPrevented = event();
        me.onResumed = event();
        emittable( me );

    }

    var p = Ctor.prototype;

    /**
     * Bind Chuanr with specific input elment
     */
    p.roast = function (el, patterns) {
        var current;

        if ( el == null || el.tagName.toUpperCase() != 'INPUT' ) {
            throw "Target input element must be specified.";
        }

        this._el = el;

        for( var i = 0 ; i < patterns.length; i++ ) {
            current = patterns[i];
            // filter out empty string
            if ( current == null || current == false ) {
                continue;    
            }
            this.patterns.push( ioc.Pattern.parse( current, this.config ) );
        }

        this.formatter = new ioc.Formatter(this.patterns);
        
        this.oninput = new InputObserver();
        this.oninput.observe(el);
        this.oninput.oninput = bind.call( onInput, this, 1 );

        util.addListener(el, 'keydown', this._onKeyDown );
        util.addListener(el, 'focus', this._onFocus );

        if ( this._el.value != "" || this.config.placeholder.always === true ) {
            // not equal to empty spaces
            onInput.call( this, document.activeElement === el ? 1 : 0 );
        }

    };

    p.dispose = function() {
        this.oninput.dispose();
        util.removeListener( this._el, 'keydown', this._onKeyDown );
        util.removeListener( this._el, 'focus', this._onFocus );
    };

    /**
     * Return true if user input at least fulfill one of the pattern
     */
    p.intact = function(){
        // use this._el.value as backup because otherwise when there is no positive pattern present,
        // untouch will always be null
        return this.formatter.isIntact( this._untouched && this._untouched.input || this._el.value );
    };

    // expose ioc setting
    Ctor.setting = ioc;

    return Ctor;
});
myDefine(function() { return require('Chuanr'); }); 
}());