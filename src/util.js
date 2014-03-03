/**
 * Modified based on util.js in https://github.com/firstopinion/formatter.js
 */
if (typeof define !== 'function' && module ) {
    var define = require('amdefine')(module);
}
define(function(){

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