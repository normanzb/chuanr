/**
 * Modified based on util.js in https://github.com/firstopinion/formatter.js
 */
//>>excludeStart("release", pragmas.release);
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}
//>>excludeEnd("release");

define(function(){

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