var should = require('chai').should(),
    assert = require('chai').assert,
    requirejs = require('requirejs');


;!function (require, nodeRequire) {

require.config({
    nodeRequire: nodeRequire
});

var Pattern = require('../src/Pattern.js');

describe('PatternIndexQuery', function(){
    it('correctly translates function index to pattern index', function(){
        var tester = 'abcd{1234}dcba';
        var pattern = Pattern.parse( tester );
        
        var index = pattern.index().of('pattern').by( { function: { index: 0 } } );

        assert.equal( index, 4 );
    });
});

}(requirejs, require);