if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}

define(['./PatternConstant'], function ( PatternConstant ) {

    var MODE_CONSTANT = PatternConstant.MODE_CONSTANT;
    var MODE_FUNCTION = PatternConstant.MODE_FUNCTION;
    var MODE_PARAMETER = PatternConstant.MODE_PARAMETER;
    
    var EX_ARG = 'Parameter not acceptable.';

    function getIndex() {
        var query = this._query;
        var targetName = this._target;
        var funcIndex = -1, item, items = this._pattern.items;

        if ( query == null || targetName == null ) {
            return this;
        }

        if ( query.function && query.function.index != null && targetName == "pattern" ) {

            for ( var i = 0 ; i < items.length; i++ ) {
                item = items[i];
                if ( item.type == MODE_FUNCTION ) {
                    funcIndex++;
                    if ( funcIndex ==  query.function.index ) {
                        return i;
                    }
                }
            }

            return -1;
        }
        else if ( query.pattern && query.pattern.index != null && targetName == "function" ) {

            for ( var i = 0 ; i < items.length; i++ ) {

                item = items[i];

                if ( item.type == MODE_FUNCTION ) {
                    funcIndex++;
                }

                if ( i != query.pattern.index ) {
                    continue;
                }

                return funcIndex;
                
            }

            return -1;
        }
        else {
            throw EX_ARG;
        }
    }

    function Ctor ( pattern ) {
        this._pattern = pattern;
        this._target = "pattern";
    }

    var p = Ctor.prototype;

    p.by = function(query) {
        this._query = query;

        return getIndex.call(this);
    };

    p.of = function(targetName) {
        this._target = targetName;

        return this;
    };

    return Ctor;
});