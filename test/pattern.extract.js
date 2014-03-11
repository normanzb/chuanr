var should = require('chai').should(),
    assert = require('chai').assert,
    requirejs = require('requirejs');


;!function (require, nodeRequire) {

require.config({
    nodeRequire: nodeRequire
});

var Pattern = require('../src/Pattern.js');

describe('Pattern.extract', function(){
    it('extract correctly from a pattern which has function constrained with previous input', function(){
        var tester = "({1d(+1)}) {d(+1)d(+1)d(+1)d(+1)}-{d(+1)d(+1)d(+1)d}";
        var pattern = Pattern.parse( tester );
        
        var extraction = pattern.extract('(12) 3456-7893');
        assert.equal(extraction + '',  '1234567893');
    });

    it('extract correctly from a pattern which used duplication function', function(){
        var tester = "({1d(+1)}) {d(+1)xd(+1)d(+1)}-{d(=)xxx}";
        var pattern = Pattern.parse( tester );
        
        var extraction = pattern.extract('(12) 3456-6666');
        assert.equal(extraction + '',  '1234566666');
    });

});
    
}(requirejs, require);