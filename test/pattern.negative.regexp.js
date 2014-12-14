var should = require('chai').should(),
    assert = require('chai').assert,
    requirejs = require('requirejs');


;!function (require, nodeRequire) {

require.config({
    nodeRequire: nodeRequire
});

var Pattern = require('../src/Pattern.js');

describe('Pattern.negative.regexp', function(){
    it('has sub type set to regexp when pattern starts with ~|', function(){
        var tester = '~|\\w/i';
        var pattern = Pattern.parse( tester );
        assert.equal( ( pattern.type & 1 ) , 1 );
        assert.equal( ( pattern.type & 2 ) , 2 );
    });

    it('should return a RegExp which ignoreCase set to true', function(){
        var tester = '~|\\w/i';
        var pattern = Pattern.parse( tester );
        assert.equal( pattern.regExp instanceof RegExp, true );
        assert.equal( pattern.regExp.ignoreCase, true );
    });

    it('should return a RegExp which global and ignoreCase set to true', function(){
        var tester = '~|te\\/st/gi';
        var pattern = Pattern.parse( tester );
        assert.equal( pattern.regExp instanceof RegExp, true );
        assert.equal( pattern.regExp.ignoreCase, true );
        assert.equal( pattern.regExp.global, true );
    });
});
    
}(requirejs, require);