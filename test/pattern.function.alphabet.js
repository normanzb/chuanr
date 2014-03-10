var should = require('chai').should(),
    assert = require('chai').assert,
    requirejs = require('requirejs');


;!function (require, nodeRequire) {

require.config({
    nodeRequire: nodeRequire
});

var Pattern = require('../src/Pattern.js');

describe('PatternFunction.alphabet', function(){

    /* Pattern Function */

    var ERROR_RUNTIME = 'Runtime error: ';

    it('can verify against any alphabet, returns matched', function(){
        var p;

        p = Pattern.parse("-{aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa}");

        var result = p.apply("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");

        assert.deepEqual( result,  { 
            result: '-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
            matched: true,
            legitimate: true,
            counts: { total: 52, matched: 52 },
            toString: result.toString
        } );
    });

    it('can verify against any alphabet, returns unmatched if input is not a alphabet', function(){
        var p;

        p = Pattern.parse("-{aaaaaaaaaaaaaaaaaaaa}");

        var result = p.apply("0123456789!@#$%^&*()");

        assert.deepEqual( result,  { 
            result: '-                    ',
            matched: false,
            legitimate: false,
            counts: { total: 20, matched: 0 },
            toString: result.toString
        } );
    });

});

}(requirejs, require);