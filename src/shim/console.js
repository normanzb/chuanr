
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}

define(function () {
    var noop = function(){};
    var ret = window.console || {
        log: noop,
        error: noop,
        warn: noop,
        debug: noop
    };

    ret.hr = function() {
        ret.log('=======================================');
    };

    return ret;
});