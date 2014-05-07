var should = require('chai').should(),
    assert = require('chai').assert,
    requirejs = require('requirejs');


;!function (require, nodeRequire) {

require.config({
    nodeRequire: nodeRequire
});

var Pattern = require('../src/Pattern.js');

describe('PatternFunction.luhn', function(){

    describe('positive', function(){

        it('matches a correct luhn complaint string', function(){
            var p;
            var tester = "343023168135257";
            p = Pattern.parse("{34ddd}-{ddddd}-{ddddl}");

            var result = p.apply(tester);

            assert.deepEqual( result,  { 
                result: "34302-31681-35257",
                matched: true,
                legitimate: true,
                counts: { total: 15, matched: 15 },
                toString: result.toString
            } );
        });

        it('does not match string which does not complaint', function(){
            var p;
            var tester = "343023168135256";
            p = Pattern.parse("{34ddd}-{ddddd}-{ddddl}");

            var result = p.apply(tester);

            assert.deepEqual( result,  { 
                result: "34302-31681-3525 ",
                matched: false,
                legitimate: false,
                counts: { total: 15, matched: 14 },
                toString: result.toString
            } );
        });

    });

    describe('negative', function(){

        it('does not matches a correct luhn complaint string', function(){
            var p;
            var tester = "343023168135257";
            p = Pattern.parse("-|{34ddd}-{ddddd}-{ddddL}");

            var result = p.apply(tester);

            assert.deepEqual( result,  { 
                result: "34302-31681-3525 ",
                matched: false,
                legitimate: true,
                counts: { total: 15, matched: 14 },
                toString: result.toString
            } );
        });

        it('matches string which does not complaint', function(){
            var p;
            var tester = "343023168135256";
            p = Pattern.parse("-|{34ddd}-{ddddd}-{ddddL}");

            var result = p.apply(tester);

            assert.deepEqual( result,  { 
                result: "34302-31681-35256",
                matched: true,
                legitimate: false,
                counts: { total: 15, matched: 15 },
                toString: result.toString
            } );
        });

    });

});

}(requirejs, require);