(function() { 
var global = new Function('return this')();var parentDefine = global.define || (function(factory){ var ret = factory();typeof module != 'undefined' && (module.exports = ret) ||(global.Chuanr = ret); }) ;/**
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

if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}
define('shim/../../lib/boe/src/boe/util',[],function(){
    
    
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

if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}

/** 
 * for debugging in iOS 5 simulator, you will need technic here:
 * https://gist.github.com/normanzb/9409129
 * and then download chromium verion 12
 * visit http://localhost:9999
 * and then run script here: 
 * https://gist.github.com/normanzb/9410988 in your console
 */

define('shim/console',['../../lib/boe/src/boe/util'], function (boeUtil) {
    var MAX_NESTING = 3;
    var logs = '';
    var userAgent = navigator.userAgent.toUpperCase();
    var isIE = userAgent.indexOf('MSIE') > 0 || 
        userAgent.indexOf('TRIDENT') > 0 ;
    var iOS5 = userAgent.indexOf('OS 5_0 LIKE MAC OS X') > 0
    var ret, nestingCount, isIE, shim = {
        log: iOS5 ? iOS5Log :noop,
        error: redir,
        warn: redir,
        debug: redir
    };
    var bak = {};

    function noop(){};

    function iOS5Log(msg) {
        if ( bak['log'] ) {
            bak.log.call(ret, msg);
        }
        // var img = document.createElement('image');
        // img.src = './log.gif?' + encodeURI(msg);

        logs = logs + '\n' + msg;
    }

    function redir(){
        return this.log.apply(this, arguments);
    }

    function stringify( arg, nestingCount ){
        nestingCount = nestingCount >>> 0 ;
        if ( ( nestingCount >>> 0 ) >= MAX_NESTING ) {
            return '...';
        }

        type = boeUtil.type( arg );
        str = '';

        if ( type == 'Object' ) {
            str = '{';
            for( var key in arg ) {
                str += '"' + key + '" : ' + stringify( arg[key], nestingCount + 1 ) + ',';
            }
            str += '}'
        }
        else if ( type == 'Array' ) {
            str = '[' + arg.toString() + ']';
        }
        else if ( type == 'Undefined' || type == 'Null' ) {
            str = type;
        }
        else {
            str = arg.toString();
        }

        return str;
    }

    function ieFuncWrapper(func){
        return function(){
            var args = boeUtil.slice(arguments);
            for( var i = 0; i < args.length; i++ ) {
                args[i] = stringify(args[i]);
            }
            
            return Function.prototype.call.call(func, this, args.join(' ') );
        };
    };

    var ret = window.console;

    for( var key in shim ) {
        if ( !shim.hasOwnProperty(key) ) {
            continue;
        }

        if ( ret[ key ] == null || iOS5 ) {
            bak[ key ] = ret[ key ];
            ret[ key ] = shim[ key ];
        }

        if ( isIE  || iOS5 ) {
            ret[ key ] = ieFuncWrapper( ret[ key ] );
        }

    }

    ret.hr = function() {
        ret.log('=======================================');
    };

    ret.logs = function(){
        return logs;
    };

    return ret;
});
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}
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
 * Trim specified chars at the start and the end of current string.
 * @member String.prototype
 * @return {String} trimed string
 * @es5
 */
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}
define('../lib/boe/src/boe/String/trim',['../util'], function (util) {
    var STRING_PROTO = util.g.String.prototype;
    return STRING_PROTO.trim || function() {
        var trimChar = '\\s';
        var re = new RegExp('(^' + trimChar + '*)|(' + trimChar + '*$)', 'g');
        return this.replace(re, "");
    };
});

if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}

define('Formatter',['./shim/console', '../lib/boe/src/boe/String/trim'], function (console, trim) {

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
        var ret = null,
            extraction;

        if ( this._current && this._current.pattern ) {
            try{
                ret = this._current.pattern.extract( formatted );
                ret.pattern = this._current.pattern;
            }
            catch(ex){
                console.log('Best bet extraction failed, will try the others...');
            }
        }

        // try to find out best extraction
        for( var l = this.patterns.length; l--; ) {
            try{
                extraction = this.patterns[l].extract( trim.call(formatted) );
            }
            catch(ex) {
                continue;
            }

            if ( ret == null || extraction.length > ret.length ) {
                ret = extraction;
                ret.pattern = this.patterns[l];
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
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}

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

    var ret = function(input, param, context){

        if ( param == '=' ) {
            if ( noPrev(context) ) {
                return false;
            }
            else {
                return input == context.prev;
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

                return input == ( context.prev * 1 + ( param >> 0 ) );
            }
        }

        if ( param == null || (param == 0 && param !== '0') ) {
            param = "0-9";
        }

        if ( regexAcceptableParam.test( param ) ) {
            throw new Error( EX_NOT_CORRECT_PARAM );
        }
        
        return new RegExp("^[" + param + "]$").test( input );
    };

    return ret;
});
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}

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

    var ret = function(input, param, context){

        if ( param == '=' ) {
            if ( noPrev(context) ) {
                return false;
            }
            else {
                return input == context.prev;
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

                return input.charCodeAt(0) == ( context.prev * 1 + ( param >> 0 ) ).charCodeAt(0);
            }
        }

        if ( param == null || (param == 0 && param !== '0') ) {
            param = AZAZ;
        }

        if ( regexAcceptableParam.test( param ) ) {
            throw new Error( EX_NOT_CORRECT_PARAM );
        }
        
        return new RegExp("^[" + param + "]$").test( input );
    };

    return ret;
});
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}
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
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}

define('PatternConstant',[],function(){
    return {
        MODE_CONSTANT : 1,
        MODE_FUNCTION : 2,
        MODE_PARAMETER : 4
    };
});
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}

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
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}

define('Pattern',[
    './PatternFunction/digit', 
    './PatternFunction/alphabet', 
    '../lib/boe/src/boe/Object/clone', 
    './PatternIndexQuery', 
    './PatternConstant'
], function ( pfDigit, pfAlphabet, boeClone, PatternIndexQuery, PatternConstant ) {

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
                    prev: input.charAt( i - 1 )
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
        if ( str.length > this.items.length ) {
            throw EX_NOT_FORMATTED;
        }

        var ret = [], item, items = this.items, func, context, curChar;

        for( var i = 0; i < str.length ; i++ ) {
            item = items[i];
            curChar = str.charAt(i);

            if ( item.type == MODE_FUNCTION ) {
                func = Ctor.functions[item.value];

                if ( func == null ) {
                    throw EX_NOT_FORMATTED;
                }

                if ( curChar == ' ' ) {
                    // skip it as it is a placeholder
                    continue;
                }

                context = {
                    prev: str.charAt(i - 1)
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
        'd': pfDigit,
        'a': pfAlphabet,
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
if (typeof define !== 'function' && module ) {
    var define = require('amdefine')(module);
}
define('util',[],function(){

    var util = {};

    // Useragent info for keycode handling
    var uAgent = (typeof navigator !== 'undefined') ? navigator.userAgent : null,
        iPhone = /iphone/i.test(uAgent);

    //
    // Return true/false is num false between bounds
    //
    util.isBetween = function (num, bounds) {
        bounds.sort(function(a,b) { return a-b; });
        return (num > bounds[0] && num < bounds[1]);
    };

    //
    // Helper method for cross browser event listeners
    //
    util.addListener = function (el, evt, handler) {
        return (typeof el.addEventListener != "undefined")
            ? el.addEventListener(evt, handler, false)
            : el.attachEvent('on' + evt, handler);
    };

    //
    // Helper method for cross browser implementation of preventDefault
    //
    util.preventDefault = function (evt) {
        return (evt.preventDefault) ? evt.preventDefault() : (evt.returnValue = false);
    };

    //
    // Helper method for cross browser implementation for grabbing
    // clipboard data
    //
    util.getClip = function (evt) {
        if (evt.clipboardData) { return evt.clipboardData.getData('Text'); }
        if (window.clipboardData) { return window.clipboardData.getData('Text'); }
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

    //
    // Return true if the input is in the range of acceptable keycode
    // 
    util.isAcceptableKeyCode = function(kc) {

        if ( 
            // 0-9
            ( kc >= 48 && kc <= 57 ) || 
            // a-z
            ( kc >= 65 && kc <= 90 ) || 
            // keypad 0-9
            ( kc >= 96 && kc <= 105 ) ||
            util.isDelKey( kc ) ||
            util.isBackSpaceKey( kc )
        ) {
            return true;
        }

        return false;
    };

    util.isMovementKeyCode = function( k ) {

        if ( 
            k >= 37 && k <= 40 || k == 9
        ) {
            return true;
        }

        return false;

    };

    return util;
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
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}

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
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}
define('../lib/boe/src/boe/Function/bind',['../util'], function (util) {
    // simply alias it
    var FUNCTION_PROTO = util.g.Function.prototype;

    return FUNCTION_PROTO.bind || util.bind;
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
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}

define('shim/oninput',[],function () {
    var INPUT = 'input';

    /* Feature Detection */

    var hasOnInput = function(){
        /*
            The following function tests an element for oninput support in Firefox.
            Many thanks to:
            http://blog.danielfriesen.name/2010/02/16/html5-browser-maze-oninput-support/
        */
        function checkEvent(el) {
            // First check, for if Firefox fixes its issue with el.oninput = function
            el.setAttribute("oninput", "return");
            if (typeof el.oninput == "function"){
                return true;
            }

            // Second check, because Firefox doesn't map oninput attribute to oninput property
            try {
                var e  = document.createEvent("KeyboardEvent"),
                    ok = false,
                    tester = function(e) {
                        ok = true;
                        e.preventDefault();
                        e.stopPropagation();
                    }
                e.initKeyEvent("keypress", true, true, window, false, false, false, false, 0, "e".charCodeAt(0));
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
        return "oninput" in testee || checkEvent(testee);
    }();

    /* Public */
    
    function Observer(){
        this._old = '';
        this.oninput = function(){};
    }

    var p = Observer.prototype;

    p.observe = function(el){
        if ( el == null || el.tagName.toLowerCase() != INPUT ) {
            throw "Target input element must be specified.";
        }

        var me = this;

        if ( hasOnInput ) {
            el.addEventListener(INPUT, function() {
                me.oninput();
            }, false);
        }
        else if (el.attachEvent) {
            this._old = el.value;
            el.attachEvent('onpropertychange', function(evt){
                if ( evt.propertyName == "value" && el.value != this._old ) {
                    this._old = el.value;
                    me.oninput();
                }
            });
        }
        else {
            throw "Something wrong, should never goes to here.";
        }
    };

    return Observer;

});

if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}

define('Chuanr',['./Formatter', 
    './Pattern', 
    './util', 
    './caret', 
    './differ', 
    '../lib/boe/src/boe/Function/bind', 
    '../lib/boe/src/boe/String/trim', 
    '../lib/boe/src/boe/Object/clone', 
    '../lib/boe/src/boe/util', 
    '../lib/cogs/src/cogs/emittable',
    '../lib/cogs/src/cogs/event',
    './shim/oninput',
    './shim/console'], 
    function ( 
        Formatter, Pattern, util, caretUtil, differUtil,
        bind, trim, clone, boeUtil, 
        emittable, event, 
        InputObserver, console ) {

    // ioc settings
    var ioc = {
        Formatter: Formatter,
        Pattern: Pattern,
        InputObserver: InputObserver
    };

    var defaultSettings = {
        speculation: {
            batchinput: true
        }
    };

    /* Private Methods */
    function tryExtractAndResetCaret( value, caret ) {
        // do a filtering before actual inputting
        var original, extraction;

        try{
            console.log( "Do Extraction of '" + value + "'");
            extraction = this.formatter.extract( value );
            if ( extraction != null ) {
                original = trim.call( extraction + '' );
                console.log( "Exracted", original );
            }
        }
        catch(ex){
            original = null;
        }

        if ( original == null ) {
            console.log( "Extraction failed " );
        }

        if ( caret && original != null ){

            console.log( 'Caret before update: ', caret );

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

            console.log( 'Original input extracted: "' + original + '"' , 'Updated caret: ', caret );

        }

        if ( original == 0 ) {
            this._isFormatted = false;
        }

        return original;
    }

    function extraRawData( input, caret ){
        var prev, ret, prevInput, begin, end, isConstantDeletion = false,
            prefix, postfix;

        console.log('Not raw data, need some sophisicated logic to figure out');

        prev = this._untouched ? this._untouched.result + '' : '';

        differ = differUtil.diff(
            prev, 
            input
        );

        console.log("Differ '" + prev + "':'" + input + "'", differ);

        extraction = this.formatter.extract( prev );

        if ( extraction == null ) {
            return ret;
        }

        prevInput = extraction + '';

        isSpaceDeletion = differ.insertion.caret.begin == differ.insertion.caret.end &&
            (
                extraction.pattern.items[caret.begin].type == 2 && 
                differ.deletion.text == ' '
            );

        isConstantDeletion = differ.insertion.caret.begin == differ.insertion.caret.end &&
            differ.deletion.text.length > 0 && 
            (
                extraction.pattern.items[caret.begin].type == 1
            );

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
            console.log("User deleted " + differ.deletion.text.length + "space/constant(s)");
            begin = extraction.pattern
                .index().of('function').by({ pattern: { index: caret.begin }}) - (isConstantDeletion?1:0);
        }

        prefix = prevInput.substring( 0, begin );
        postfix = prevInput.substring( end, prevInput.length + 1);

        // prefix.length - trim.call( prefix ).length 

        input = prefix + differ.insertion.text + postfix;
            
        if ( caret != null ) {
            if ( isSpaceDeletion || isConstantDeletion ) {
                caret.begin = begin;
                caret.end = caret.begin;
                caret.type = 2;
            }
            else {
                caret.begin = end + differ.insertion.text.length - differ.deletion.text.length;
                caret.end = caret.begin;
                caret.type = 2;
            }
        }

        console.log( 'Raw Input' , input, caret );

        ret = input;

        return ret;
    }

    function speculateBatchInput( input, format, caret ){

        var speculated, finalExtraction;

        console.log("Try to be smart, figure out what the user actually want to input");
        console.log("Speculation Step 1. Try Extract");
        speculated = tryExtractAndResetCaret.call( this, this._el.value, null );

        if ( speculated == null ) {

            console.log('Failed to extract.');
            console.log("Speculation Step 2. Try filter out puncuation and spaces.");

            speculated = input.replace(/\W/g,'');

            if ( speculated != 0 ) {
                // caret type still unknown, a bit trick here
                // according to https://github.com/normanzb/chuanr/issues/11
                console.log("Speculation Step 2.5. Comparing to get differ");
                differ = differUtil.diff(
                    this._untouched ? trim.call( this._untouched.result + '' ) : '', 
                    input
                );
                console.log("Differ", differ);

                input = trim.call( speculated );
            }

            // give up
            
        }
        else {

            console.log('Extracted, use extracted string.')
            input = trim.call( speculated );
            // can be extracted without problem mean the original string is formatted
            caret.type = 1;

        }

        console.log('Speculation Done, Result "' + input + '"');
        return input;
    }

    function onKeyDown( evt ) {

        if ( this._requireHandleKeyUp == true && this._keyCode == evt.keyCode) {
            // mean user keeps key down 
            // this is not allowed because it causes oninput never happen
            console.log('Continuous Key Down Prevented')
            util.preventDefault(evt);
            return;
        }

        if ( util.isAcceptableKeyCode( evt.keyCode ) == false || util.isModifier( evt ) ) {
            if ( util.isMovementKeyCode( evt.keyCode ) == false && util.isModifier( evt ) == false ) {
                console.log('Key Down Prevented')
                util.preventDefault(evt);
            }
            
            this._requireHandlePress = false;
            this._requireHandleInput = false;
            return;
        }

        console.hr();

        this._keyCode = evt.keyCode;
        this._caret = caretUtil.get( this._el );
        this._charCode = null;

        if ( this._isFormatted && this._el.value !== "" ) {
            this._el.value = tryExtractAndResetCaret.call( this, this._el.value, this._caret );
        }

        if ( util.isDelKey( evt.keyCode ) == false && 
            util.isBackSpaceKey( evt.keyCode ) == false ) {
            this._requireHandlePress = true;
        }
        
        this._requireHandleInput = true;
        this._requireHandleKeyUp = true;
    }

    function onKeyPress( evt ) {
        if ( this._requireHandlePress == false ) {
            return;
        }

        this._charCode = evt.keyCode || evt.charCode;

        this._requireHandlePress = false;
    }

    function onInput( ) {
        if ( this._requireHandleInput && 
            // if below check == true, means keyDown happen but keypress never happen, 
            // quite possible it is a undo
            this._requireHandlePress != true ) {

            console.log ( 'Input Type: Single: ', String.fromCharCode( this._charCode ) );

            render.call( this, {
                'key': this._keyCode,
                'char': this._charCode,
                'del': util.isDelKey( this._keyCode ),
                'back': util.isBackSpaceKey( this._keyCode ),
                'caret': this._caret
            } );
            
        }
        else {

            console.hr();

            console.log ( 'Input Type: Batch: ', this._el.value );

            render.call(this);

        }

        this._requireHandlePress = false;
        this._requireHandleInput = false;
    }

    function onKeyUp( evt ) {
        // protection mechanism
        // some browsers (e.g. IE) doesn't support oninput
        // so we compulsorily make it here
        if ( this._requireHandleInput == true ) {
            console.log('Compulsorily call into onInput')
            onInput.call(this);
        }

        this._requireHandleKeyUp = false;
    }

    function render( input ) {
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
        var caretMove = true;
        var format;
        var undid = false;
        // 0 == Batch Input
        // 1 == Single Input
        var inputType = input ? 1 : 0;
        

        if ( inputType ) {
            // == Single Input == 

            // 1. Initial Caret
            caret = input.caret;

            // 2. Initial Format
            this.formatter.input( input );
            format = this.formatter.output();

            // 3. Advance Caret?
            if ( format.result.matched == false ) {
                caretMove = false;
            }
            else if ( input.del || input.back ) {
                caretMove = false;
                if ( caret.begin > 0 ) {
                   caret.begin -= 1; 
                }
                if ( caret.end > 0 ) {
                    caret.end -= 1
                }
            }

        }
        else {
            // == Batch Input ==
            input = this._el.value;

            // 1. Initial Caret
            // the caret at the point could be with format or without
            // will will handle it later
            caret = caretUtil.get( this._el );

            // 2. Initial Format
            // that means the change is done by pasting, dragging ...etc
            format = this.formatter.reset( input );

            // 2.5 Batch Input Tricks
            if ( format.result.matched ) {
                // match immediately means user inputs raw numbers
                caret.type = 2;
            }
            else {

                input = extraRawData.call( this, input, caret );
                format = this.formatter.reset( input );
                
                if ( 
                    format.result.matched == false && 
                    this.config.speculation.batchinput == true ) {
                    // get a matched format by trying different type of input
                    // also caret will be adjusted here
                    input = speculateBatchInput.call( this, input, format, caret );
                    format = this.formatter.reset( input );
                }
            }

            // 3. Advance Caret?
            caretMove = false;

        }

        // revert if match failed
        while ( format.result.matched == false ) {

            undid = format;
            format = this.formatter.undo()

            console.log('Failed to format, undo.');

            if ( format == null ) {
                console.log('Tried to undo, but failed.');
                break;
            }

            caret.begin = tryExtractAndResetCaret.call( this, format.result.toString(), null ).length;
            caret.end = caret.begin;
            caretMove = false;
            caret.type = 2;
        }

        if ( format == null ) {
            throw 'Boom, "format" is null, this should never happen.';
        }

        console.log( 'Final Format', format.result.toString() );

        // record the final format
        this._untouched = format;
        // update the element
        this._el.value = format.result;

        // update the caret accordingly
        console.log('Caret before format: ', caret );
        console.log('Move caret? ', caretMove);

        if ( inputType ) {
            caret.begin = this.formatter
                .index()
                    .of('pattern')
                    .by({ 'function': { index: caret.begin + ( caretMove ? 1 : 0 ) } });

            if ( caret.begin < 0 ) {
                caret.begin = this._el.value.length;
            }    
        }
        else {
            if ( caret.type === 2 ) {
                caret.begin = this.formatter
                    .index()
                        .of('pattern')
                        .by({ 'function': { index: caret.begin } });

            }
            else if ( caret.type === 1 ) {
                // do nothing?
            }
        }

        console.log('Caret after format: ', caret);

        // set cursor
        caretUtil.set( this._el, caret.begin );

        // this is to prevent some iOS shits to reset the caret after we set it
        // TODO: user setImmediate shim to make it faster?
        setTimeout(function(){
            if ( caretUtil.get( me._el) == caret.begin ) {
                return;
            }

            // oh shit, we failed
            caretUtil.set( me._el, caret.begin );
        });

        if ( format.result != 0 ) {
            this._isFormatted = true;
        }
        else {
            this._isFormatted = false;
        }

        // fire event
        if ( undid ) {
            this.onPrevented.invoke( undid );
        }
        else {
            this.onResumed.invoke( format );
        }

    }

    /* Public Methods */
    function Ctor( config ) {
        this.patterns = [];
        this.formatter = null;
        this.oninput = null;
        this.config = clone.call(defaultSettings, true);
        boeUtil.mixin( this.config, config );

        this._el = null;
        this._requireHandlePress = false;
        this._requireHandleInput = false;
        this._requireHandleKeyUp = false;
        this._keyCode = null;
        this._charCode = null;
        this._caret = null;
        this._untouched = null;
        this._isFormatted = false;

        this.onPrevented = event();
        this.onResumed = event();
        emittable( this );

    }

    var p = Ctor.prototype;

    /**
     * Bind Chuanr with specific input elment
     */
    p.roast = function (el, patterns) {

        if ( el == null || el.tagName.toUpperCase() != 'INPUT' ) {
            throw "Target input element must be specified.";
        }

        this._el = el;

        for( var i = 0 ; i < patterns.length; i++ ) {
            this.patterns.push( ioc.Pattern.parse( patterns[ i ] ) );
        }

        this.formatter = new ioc.Formatter(this.patterns);
        
        this.oninput = new InputObserver();
        this.oninput.observe(el);
        this.oninput.oninput = bind.call(onInput, this);

        util.addListener(el, 'keydown', bind.call(onKeyDown, this));
        util.addListener(el, 'keypress', bind.call(onKeyPress, this));
        util.addListener(el, 'keyup', bind.call(onKeyUp, this));

        if ( this._el.value != "" ) {
            // not equal to empty spaces
            onInput.call(this);
        }

    };

    /**
     * Return true if user input at least fulfill one of the pattern
     */
    p.intact = function(){
        if ( this._untouched == null || this._untouched == "" ) {
            return false;
        }

        var result = this._untouched.pattern.apply( this._untouched.input , true );

        return result.matched;
    };

    // expose ioc setting
    Ctor.setting = ioc;

    return Ctor;
});
parentDefine(function() { return require('Chuanr'); }); 
}());