(function() { 
var global = new Function('return this')();var parentDefine = global.define || (function(factory){ var ret = factory();typeof module != 'undefined' && (module.exports = ret) ||(global.chuanr = ret); }) ;/**
 * @license almond 0.2.9 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                name = baseParts.concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("../node_modules/almond/almond", function(){});




define('Formatter',[],function () {

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
define( 'PatternFunction/digit',[],function () {
    var ret = function(input, param){

        if ( param == null || param == false ) {
            param = "0-9";
        }
        
        return new RegExp("^[" + param + "]$").test( input );
    };

    return ret;
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
/* Pattern */


define('Pattern',['./PatternFunction/digit', '../lib/boe/src/boe/Object/clone'], function ( pfDigit, boeClone ) {

    var PLACE_HOLDER_FUNCTION_START = "{";
    var PLACE_HOLDER_FUNCTION_END = "}";
    var PLACE_HOLDER_CALL_START = "(";
    var PLACE_HOLDER_CALL_END = ")";

    var MODE_CONSTANT = 1;
    var MODE_FUNCTION = 2;
    var MODE_PARAMETER = 4;

    var EX_SYNTAX = 'Syntax error';
    var EX_RUNTIME = 'Runtime error';
    var EX_NOT_TAG = 'Not a tag.';

    /**
     * return a formatted string for throwing exception
     */
    function getSyntaxError(innerError, index) {
        return EX_SYNTAX + ": " + innerError + ":" + index;    
    }
    function getRuntimeError(innerError, index) {
        return EX_RUNTIME + ": " + innerError + ":" + index;    
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
        parse.call(this, pattern);

    }

    var p = Ctor.prototype;

    /**
     * Return true if input matches current pattern
     */
    p.match = function ( string, isFullyMatch ) {
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

        if ( input.length > matches.length ) {
            return false;
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

        // output the final result
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
            result: result, 
            matched: matched, 
            counts: { 
                total: len, 
                matched: matchedCount 
            } 
        };
        
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
/**
 * Modified based on util.js in https://github.com/firstopinion/formatter.js
 */
define('util',[],function(){

    var utils = {};

    // Useragent info for keycode handling
    var uAgent = (typeof navigator !== 'undefined') ? navigator.userAgent : null,
        iPhone = /iphone/i.test(uAgent);

    //
    // Shallow copy properties from n objects to destObj
    //
    utils.extend = function (destObj) {
        for (var i = 1; i < arguments.length; i++) {
            for (var key in arguments[i]) {
              destObj[key] = arguments[i][key];
            }
        }
        return destObj;
    };

    //
    // Add a given character to a string at a defined pos
    //
    utils.addChars = function (str, chars, pos) {
        return str.substr(0, pos) + chars + str.substr(pos, str.length);
    };

    //
    // Remove a span of characters
    //
    utils.removeChars = function (str, start, end) {
        return str.substr(0, start) + str.substr(end, str.length);
    };

    //
    // Return true/false is num false between bounds
    //
    utils.isBetween = function (num, bounds) {
        bounds.sort(function(a,b) { return a-b; });
        return (num > bounds[0] && num < bounds[1]);
    };

    //
    // Helper method for cross browser event listeners
    //
    utils.addListener = function (el, evt, handler) {
        return (typeof el.addEventListener != "undefined")
            ? el.addEventListener(evt, handler, false)
            : el.attachEvent('on' + evt, handler);
    };

    //
    // Helper method for cross browser implementation of preventDefault
    //
    utils.preventDefault = function (evt) {
        return (evt.preventDefault) ? evt.preventDefault() : (evt.returnValue = false);
    };

    //
    // Helper method for cross browser implementation for grabbing
    // clipboard data
    //
    utils.getClip = function (evt) {
        if (evt.clipboardData) { return evt.clipboardData.getData('Text'); }
        if (window.clipboardData) { return window.clipboardData.getData('Text'); }
    };

    //
    // Returns true/false if k is a del key
    //
    utils.isDelKey = function (k) {
        return k === 46 || (iPhone && k === 127);
    };

    //
    // Returns true/false if k is a backspace key
    //
    utils.isBackSpaceKey = function (k) {
        return k === 8;
    }

    //
    // Returns true/false if k is an arrow key
    //
    utils.isSpecialKey = function (k) {
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
    utils.isModifier = function (evt) {
        return evt.ctrlKey || evt.altKey || evt.metaKey;
    };

    //
    // Return true if the input is in the range of acceptable keycode
    // 
    utils.isAcceptableKeyCode = function(kc) {

        if ( 
            // 0-9
            ( kc >= 48 && kc <= 57 ) || 
            // a-z
            ( kc >= 65 && kc <= 90 ) || 
            // keypad 0-9
            ( kc >= 96 && kc <= 105 ) ||
            utils.isDelKey( kc ) ||
            utils.isBackSpaceKey( kc )
        ) {
            return true;
        }

        return false;
    };

    utils.isMovementKeyCode = function( k ) {

        if ( 
            k >= 37 && k <= 40 || k == 9
        ) {
            return true;
        }

        return false;

    };

    return utils;
});
/*
 * caret.js
 *
 * Cross browser implementation to get and set input selections
 * Modified based on inptSel.js in https://github.com/firstopinion/formatter.js
 */
define('caret',['require'],function  (argument) {

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
/*
 * Function.bind
 */
define('../lib/boe/src/boe/Function/bind',['../util'], function (util) {
    // simply alias it
    var FUNCTION_PROTO = util.g.Function.prototype;

    return FUNCTION_PROTO.bind || util.bind;
});



define('Chuanr',['./Formatter', './Pattern', './util', './caret', '../lib/boe/src/boe/Function/bind'], 
    function ( Formatter, Pattern, util, caret, bind ) {

    // settings
    var ioc = {
        Formatter: Formatter,
        Pattern: Pattern
    };

    /* Private Methods */
    function onKeyDown ( evt ) {

        if ( util.isAcceptableKeyCode( evt.keyCode ) == false || util.isModifier( evt ) ) {
            if ( util.isMovementKeyCode( evt.keyCode ) == false && util.isModifier( evt ) == false ) {
                evt.preventDefault();
            }
            this._requireHandlePress = false;
            this._requireHandleInput = false;
        }

        this._keyCode = evt.keyCode;
        this._caret = caret.get( this._el );
        this._charCode = null;

        if ( util.isDelKey( evt.keyCode ) == false && 
            util.isBackSpaceKey( evt.keyCode ) == false ) {
            this._requireHandlePress = true;
        }

        this._requireHandleInput = true;
    }

    function onKeyPress(evt) {
        if ( this._requireHandlePress == false ) {
            return;
        }

        this._charCode = evt.keyChar || evt.keyCode;

        this._requireHandlePress = false;
    }

    function onInput(evt) {
        if ( this._requireHandleInput == false ) {
            return;
        }

        render.call( this, {
            key: this._keyCode,
            char: this._charCode,
            del: util.isDelKey( this._keyCode ),
            back: util.isBackSpaceKey( this._keyCode ),
            caret: this._caret
        } );

        this._requireHandlePress = false;
        this._requireHandleInput = false;
    }

    function render( input ) {
        
        this.formatter.input( input );

        var format = this.formatter.output();

        if ( format == null ) {

            // revert to original value
            format = this._untouched;

        }

        this._untouched = format;

        console.log( format );

    }

    /* Public Methods */
    function Ctor() {
        this.patterns = [];
        this.formatter = null;

        this._el = null;
        this._requireHandlePress = false;
        this._requireHandleInput = false;
        this._keyCode = null;
        this._charCode = null;
        this._caret = null;
        this._untouched = '';
        this.isFormatted = false;
    }

    var p = Ctor.prototype;

    /**
     * Bind Chuanr with specific input elment
     */
    p.roast = function (el, patterns) {

        if ( this._el != null ) {
            // TODO;
        }

        this._el = el;

        for( var i = 0 ; i < patterns.length; i++ ) {
            this.patterns.push( ioc.Pattern.parse( patterns[ i ] ) );
        }

        this.formatter = new ioc.Formatter(this.patterns);

        util.addListener(el, 'keydown', bind.call(onKeyDown, this));
        util.addListener(el, 'keypress', bind.call(onKeyPress, this));
        util.addListener(el, 'input', bind.call(onInput, this));

    };

    // expose ioc setting
    Ctor.setting = ioc;

    return Ctor;
});
parentDefine(function() { return require('chuanr'); }); 
}());