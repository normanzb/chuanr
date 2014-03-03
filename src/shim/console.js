
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}

define(['../../lib/boe/src/boe/util'], function (boeUtil) {
    var MAX_NESTING = 3;
    var ret, nestingCount, isIE, shim = {
        log: noop,
        error: redir,
        warn: redir,
        debug: redir
    };

    isIE = navigator.userAgent.toUpperCase().indexOf('MSIE') > 0 || 
        navigator.userAgent.toUpperCase().indexOf('TRIDENT') > 0 ;

    function noop(){};

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

        if ( ret[key] == null  ) {
            ret[ key ] = shim[ key ];
        }

        if ( isIE ) {
            ret[ key ] = ieFuncWrapper( ret[ key ] );
        }

    }

    ret.hr = function() {
        ret.log('=======================================');
    };

    return ret;
});