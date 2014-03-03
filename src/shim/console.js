
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}

define(['../../lib/boe/src/boe/util'], function (boeUtil) {
    var MAX_NESTING = 3;
    var ret, nestingCount;

    function noop(){};

    function stringify( arg ){
        if ( nestingCount >= MAX_NESTING ) {
            return '...';
        }

        type = boeUtil.type( arg );
        str = '';

        if ( type == 'Object' ) {
            str = '{';
            for( var key in arg ) {
                str += 'key:' + stringify( arg[key] ) + ',';
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

        nestingCount++;

        return str;
    }

    function ieFuncWrapper(func){
        return function(){
            var args = boeUtil.slice(arguments);
            for( var i = 0; i < args.length; i++ ) {
                nestingCount = 0;
                args[i] = stringify(args[i]);

            }
            
            return func.call(this, args.join(' ') );
        };
    };

    var ret = window.console || {
        log: noop,
        error: noop,
        warn: noop,
        debug: noop
    };

    if ( navigator.userAgent.toUpperCase().indexOf('MSIE') > 0 || 
        navigator.userAgent.toUpperCase().indexOf('TRIDENT') > 0 ) {
        for ( var key in ret ) {

            if (typeof ret[key] == 'function') {
                ret[ key ] = ieFuncWrapper( ret[ key ] );
            }

        }
    }

    ret.hr = function() {
        ret.log('=======================================');
    };

    return ret;
});