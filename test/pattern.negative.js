var should = require('chai').should(),
    assert = require('chai').assert,
    requirejs = require('requirejs');


;!function (require, nodeRequire) {

require.config({
    nodeRequire: nodeRequire
});

var Pattern = require('../src/Pattern.js');

describe('Pattern.negative', function(){
    it('has type set to negative when pattern starts with -|', function(){
        var tester = '-|{ddddd}';
        var pattern = Pattern.parse( tester );
        assert.equal( ( pattern.type & 1 ) , 1 );
        assert.notEqual( ( pattern.type & 4 ) , 4 );
        assert.notEqual( ( pattern.type & 2 ) , 2 );
    });
});
    
}(requirejs, require);