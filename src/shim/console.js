
if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function () {
    var noop = function(){};
    return window.console || {
        log: noop,
        error: noop,
        warn: noop,
        debug: noop
    };
});