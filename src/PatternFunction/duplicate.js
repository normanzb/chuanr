//>>excludeStart("release", pragmas.release);
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}
//>>excludeEnd("release");
define( function () {
    var ret = function(input, param, context){
        var index = context.index >>> 0;
        var items = context.pattern.items;
        var prevItem;
        var prevFunc;
        var matches = [];

        if ( param == 'o' && input == '') {
            return true;
        }

        for(var l = items.length;l--; ){
            if ( items[l].type == 2 ) {
                matches.unshift(items[l]);
            }
        }

        for(var l = matches.length;l--; ){
            if ( l == index - 1 ) {
                prevItem = matches[l];
                prevFunc = context.pattern.constructor.functions[prevItem.value];
                if ( ret !== prevFunc ) {
                    break;
                }
                else {
                    index--;
                }
            }
        }

        if ( prevFunc == null || ret == prevFunc ) {
            throw new Error("No previous function");
        }

        return prevFunc.call(this, input, prevItem.param, context);
    };

    return ret;
});