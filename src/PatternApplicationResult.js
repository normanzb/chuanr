/* Pattern */
//>>excludeStart("release", pragmas.release);
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}
//>>excludeEnd("release");

define(function(){
    'use strict';

    function Ctor(options) {
        // the actual string after applied the pattern
        this.result = options.result || '';
        this.matched = options.matched || false;
        this.legitimate = ( typeof options.legitimate === 'boolean' ? 
                options.legitimate : options.matched
            ) || false;
        this.counts = {
            total: options.counts && options.counts.total || 0,
            matched: options.counts && options.counts.matched || 0
        };
    }

    Ctor.prototype.toString = function resultToString() {
        return this.result;
    };

    return Ctor;
});