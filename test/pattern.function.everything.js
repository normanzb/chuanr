var should = require('chai').should(),
    assert = require('chai').assert,
    requirejs = require('requirejs');


;!function (require, nodeRequire) {

require.config({
    nodeRequire: nodeRequire
});

var Pattern = require('../src/Pattern.js');

describe('PatternFunction.never', function(){

    /* Pattern Function */

    it('return true no matter what is the input', function(){
        var p;
        var tester = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        p = Pattern.parse("{*}");

        for(var l = tester.length; l--; ) {
            var result = p.apply(tester.charAt(l));

            assert.deepEqual( result,  { 
                result: tester.charAt(l),
                matched: true,
                legitimate: true,
                counts: { total: 1, matched: 1 },
                toString: result.toString
            } );
        }
    });

    it('return true even when there is no input', function(){
        var p;
        p = Pattern.parse("{*}");

        var result = p.apply('');

        assert.deepEqual( result,  { 
            result: ' ',
            matched: true,
            legitimate: true,
            counts: { total: 0, matched: 0 },
            toString: result.toString
        } );
    });

});

}(requirejs, require);