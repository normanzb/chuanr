var should = require('chai').should(),
    assert = require('chai').assert,
    requirejs = require('requirejs');


;!function (require, nodeRequire) {

require.config({
    nodeRequire: nodeRequire
});

var Pattern = require('../src/Pattern.js');

describe('Pattern.negative.passive', function(){
    it('has sub type set to passive when pattern starts with _|', function(){
        var tester = '_|{ddddd}';
        var pattern = Pattern.parse( tester );
        assert.equal( ( pattern.type & 1 ) , 1 );
        assert.equal( ( pattern.type & 4 ) , 4 );
    });

    it('should consider _ as pattern function', function(){
        var tester = '_|{ddddd}';
        var pattern = Pattern.parse( tester );
        assert.notEqual( pattern.items[0].value, '_' );
    });

    it('works as normal negative pattern', function(){
        var tester = '_|{ddddd}';
        var pattern = Pattern.parse( tester );
        var result = pattern.apply( 1234 );
        assert.deepEqual( result,  { 
            result: '1234 ',
            matched: false,
            legitimate: true,
            counts: { total: 5, matched: 4 },
            toString: result.toString
        } );
        var result = pattern.apply( 12345 );
        assert.deepEqual( result,  { 
            result: '12345',
            matched: true,
            legitimate: false,
            counts: { total: 5, matched: 5 },
            toString: result.toString
        } );
    });
});
    
}(requirejs, require);