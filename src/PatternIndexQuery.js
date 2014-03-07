//>>excludeStart("release", pragmas.release);
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}
//>>excludeEnd("release");

define(['./PatternConstant'], function ( PatternConstant ) {

    var MODE_CONSTANT = PatternConstant.MODE_CONSTANT;
    var MODE_FUNCTION = PatternConstant.MODE_FUNCTION;
    var MODE_PARAMETER = PatternConstant.MODE_PARAMETER;
    
    var EX_ARG = 'Parameter not acceptable.';

    function getIndex() {
        var query = this._query;
        var targetName = this._target;
        var funcIndex, item, items = this._pattern.items, lastIndex;

        if ( query == null || targetName == null ) {
            return this;
        }

        if ( query['function'] && query['function'].index != null && targetName == "pattern" ) {
            funcIndex = -1

            for ( var i = 0 ; i < items.length; i++ ) {
                item = items[i];
                if ( item.type == MODE_FUNCTION ) {
                    funcIndex++;
                    lastIndex = i;
                    if ( funcIndex ==  query['function'].index ) {
                        return i;
                    }
                }
            }

            if ( query['function'].index == funcIndex + 1 ) {
                return lastIndex + 1;
            }

            return -1;
        }
        else if ( query.pattern && query.pattern.index != null && targetName == "function" ) {
            funcIndex = 0;

            if ( query.pattern.index < 0 ) {
                return -1;
            }

            for ( var i = 0 ; i < items.length && query.pattern.index > 0 ; i++ ) {

                item = items[i];

                if ( item.type == MODE_FUNCTION ) {
                    funcIndex++;
                }

                if ( i != query.pattern.index - 1 ) {
                    continue;
                }

                return funcIndex;
                
            }

            return funcIndex;
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