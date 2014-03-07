
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

define(['../../lib/boe/src/boe/util'], function (boeUtil) {
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