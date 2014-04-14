//>>excludeStart("release", pragmas.release);
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}
//>>excludeEnd("release");
define( ['../../lib/boe/src/boe/Object/clone', ], function (clone) {
    var ret = function(input, param, context){
        var index = context.index >>> 0;
        var target = index;
        var items = context.pattern.items;
        var prevItem;
        var prevFunc;
        var matches = [];
        var curFunc;

        if ( param == '?' && input == '') {
            return true;
        }

        for(var l = items.length;l--; ){
            if ( items[l].type == 2 ) {
                matches.unshift(items[l]);
            }
        }

        for(var l = matches.length;l--; ){
            prevItem = matches[l];
            if ( l == index ) {
                curFunc = context.pattern.constructor.functions[prevItem.value];
            }
            if ( l == target - 1 ) {
                prevFunc = context.pattern.constructor.functions[prevItem.value];
                if ( curFunc !== prevFunc ) {
                    break;
                }
                else {
                    target--;
                }
            }
        }

        if ( prevFunc == null || curFunc == prevFunc ) {
            throw new Error("No previous function");
        }

        var newContext = clone.call( context );
        newContext.index = l;

        return prevFunc.call( this, input, prevItem.param, newContext );
    };

    return ret;
});