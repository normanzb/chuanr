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

    var ERROR_RUNTIME = 'Runtime error: ';

    it('return false no matter what is the input', function(){
        var p;
        var tester = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        p = Pattern.parse("{n}");

        for(var l = tester.length; l--; ) {
            var result = p.apply(tester.charAt(l));

            assert.deepEqual( result,  { 
                result: ' ',
                matched: false,
                legitimate: false,
                counts: { total: 1, matched: 0 },
                toString: result.toString
            } );
        }
    });

});

}(requirejs, require);