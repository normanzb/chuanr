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

    it('return false if input equal to previous input', function(){
        var p;
        // TODO full char range test
        var tester = "0123456789";
        p = Pattern.parse("{dn(=)}");

        for(var l = tester.length; l--; ) {
            var result = p.apply(tester.charAt(l) + tester.charAt(l));

            assert.deepEqual( result,  { 
                result: tester.charAt(l) + ' ',
                matched: false,
                legitimate: false,
                counts: { total: 2, matched: 1 },
                toString: result.toString
            } );
        }
    });

    it('return true if input not equal to previous input', function(){
        var p;
        var tester = "0123456789";
        p = Pattern.parse("{dn(=)}");

        for(var l = tester.length; l--; ) {
            var index = l-1 >= 0 ? l- 1 : tester.length - 1;
            var result = p.apply(tester.charAt(l) + tester.charAt(index));

            assert.deepEqual( result,  { 
                result: tester.charAt(l) + tester.charAt(index),
                matched: true,
                legitimate: true,
                counts: { total: 2, matched: 2 },
                toString: result.toString
            } );
        }
    });

    it('return false if the input for "never" function is an placeholder char', function(){
        var p;
        var tester = "0123456789";
        p = Pattern.parse("{dn(=)}");

        for(var l = tester.length; l--; ) {
            var result = p.apply(tester.charAt(l), true);

            assert.deepEqual( result,  { 
                result: tester.charAt(l) + ' ',
                matched: false,
                legitimate: false,
                counts: { total: 2, matched: 1 },
                toString: result.toString
            } );
        }
    });

    it('return false if input equal to specified input', function(){
        var p;
        // TODO full char range test
        var tester = "0123456789";

        for(var l = tester.length; l--; ) {
            p = Pattern.parse("{dn(" + tester.charAt(l) + ")}");
            var result = p.apply(tester.charAt(l) + tester.charAt(l));

            assert.deepEqual( result,  { 
                result: tester.charAt(l) + ' ',
                matched: false,
                legitimate: false,
                counts: { total: 2, matched: 1 },
                toString: result.toString
            } );
        }
    });

    it('return true if input not equal to specified input', function(){
        var p;
        var tester = "0123456789";

        for(var l = tester.length; l--; ) {
            var index = l-1 >= 0 ? l- 1 : tester.length - 1;
            p = Pattern.parse("{dn(" + tester.charAt(l) + ")}");
            var result = p.apply(tester.charAt(l) + tester.charAt(index));

            assert.deepEqual( result,  { 
                result: tester.charAt(l) + tester.charAt(index),
                matched: true,
                legitimate: true,
                counts: { total: 2, matched: 2 },
                toString: result.toString
            } );
        }
    });

    it('return false if the input for "never equal to specified" function is an placeholder char', function(){
        var p;
        var tester = "0123456789";

        for(var l = tester.length; l--; ) {
            p = Pattern.parse("{dn("+tester.charAt(l)+")}");
            var result = p.apply(tester.charAt(l), true);

            assert.deepEqual( result,  { 
                result: tester.charAt(l) + ' ',
                matched: false,
                legitimate: false,
                counts: { total: 2, matched: 1 },
                toString: result.toString
            } );
        }
    });

});

}(requirejs, require);