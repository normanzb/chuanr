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

    /* a(?) */

    it('returns matched when input is empty and the pattern is set to a(?) ', function(){
        var p;

        p = Pattern.parse("-{aa(?)}-");

        var result = p.apply('a');
        assert.deepEqual( result,  { 
            result: '-a -',
            matched: true,
            legitimate: true,
            counts: { total: 1, matched: 1 },
            toString: result.toString
        } );
        
    });

    it('returns matched when input is any alphabet and the pattern is set to d(?) ', function(){
        var p;

        p = Pattern.parse("-{aa(?)}-");

        var result = p.apply('ab');
        assert.deepEqual( result,  { 
            result: '-ab-',
            matched: true,
            legitimate: true,
            counts: { total: 2, matched: 2 },
            toString: result.toString
        } );
        
    });

    it('returns unmatched when input is any number and the pattern is set to d(?) ', function(){
        var p;

        p = Pattern.parse("-{aa(?)}-");

        var result = p.apply('a3');
        assert.deepEqual( result,  { 
            result: '-a -',
            matched: false,
            legitimate: false,
            counts: { total: 2, matched: 1 },
            toString: result.toString
        } );
        
    });

});

}(requirejs, require);