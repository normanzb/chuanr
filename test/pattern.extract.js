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
        console.log(extraction)
    });

});
    
}(requirejs, require);