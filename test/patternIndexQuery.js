var should = require('chai').should(),
    assert = require('chai').assert,
    requirejs = require('requirejs');


;!function (require, nodeRequire) {

require.config({
    nodeRequire: nodeRequire
});

var Pattern = require('../src/Pattern.js');

describe('PatternIndexQuery', function(){
    /* Function index to Pattern index */

    it('correctly translates function index to pattern index', function(){
        var tester = 'abcd{1234}dcba';
        var pattern = Pattern.parse( tester );
        
        var index = pattern.index().of('pattern').by( { function: { index: 0 } } );

        assert.equal( index, 4 );
    });

    it('correctly translates function index to pattern index, boundary check, beginning', function(){
        var tester = '{1234}dcba';
        var pattern = Pattern.parse( tester );
        
        var index = pattern.index().of('pattern').by( { function: { index: 0 } } );

        assert.equal( index, 0 );
    });

    it('correctly translates function index to pattern index, boundary check, ending', function(){
        var tester = 'aoih{1234}';
        var pattern = Pattern.parse( tester );
        
        var index = pattern.index().of('pattern').by( { function: { index: 3 } } );

        assert.equal( index, 7 );
    });

    it('return -1 when function index smaller than 0', function(){
        var tester = '{1234}abcddcba';
        var pattern = Pattern.parse( tester );
        
        var index = pattern.index().of('pattern').by( { function: { index: -1 } } );

        assert.equal( index, -1 );
    });

    it('return last item index + 1 when function index exceeds the max number of function available', function(){
        var tester = 'abcd{1234}';
        var pattern = Pattern.parse( tester );
        
        var index = pattern.index().of('pattern').by( { function: { index: 4 } } );

        assert.equal( index, 8 );
    });

    it('return -1 when function index exceeds the max number of function + 1', function(){
        var tester = 'abcd{1234}';
        var pattern = Pattern.parse( tester );
        
        var index = pattern.index().of('pattern').by( { function: { index: 5 } } );

        assert.equal( index, -1 );
    });

    /* Pattern index to Function index */

    it('correctly translates pattern index to function index when the element at specified position is a function ', function(){
        var tester = 'abcd{1234}dcba';
        var pattern = Pattern.parse( tester );
        
        var index = pattern.index().of('function').by( { pattern: { index: 4 } } );

        assert.equal( index, 0 );
    });

    it('correctly return following function index when the element at specified position is a constant ', function(){
        var tester = 'abcd{1234}dcba';
        var pattern = Pattern.parse( tester );
        
        var index = pattern.index().of('function').by( { pattern: { index: 3 } } );

        assert.equal( index, 0 );
    });

    it('correctly return following function index correctly when there are multiple function sections ', function(){
        var tester = 'abcd{1234}dcba{2839d}';
        var pattern = Pattern.parse( tester );
        
        var index = pattern.index().of('function').by( { pattern: { index: 9 } } );

        assert.equal( index, 4 );
    });

    it('return last function index + 1 when there is no function follows the element at specified index ', function(){
        var tester = 'abcd{1234}dcba';
        var pattern = Pattern.parse( tester );
        
        var index = pattern.index().of('function').by( { pattern: { index: 8 } } );

        assert.equal( index, 4 );
    });

    it('return last function index + 1 when specified pattern index exceeds the total pattern number', function(){
        var tester = 'abcd{1234}dcba';
        var pattern = Pattern.parse( tester );
        
        var index = pattern.index().of('function').by( { pattern: { index: 13 } } );

        assert.equal( index, 4 );
    });

    it('return 0 when specified pattern index is 0 no matter what is the first pattern', function(){
        var tester = '{1234}dcba';
        var pattern = Pattern.parse( tester );
        
        var index = pattern.index().of('function').by( { pattern: { index: 0 } } );

        assert.equal( index, 0 );
    });

    it('return -1 when specified pattern index is -1', function(){
        var tester = 'abcd{1234}dcba';
        var pattern = Pattern.parse( tester );
        
        var index = pattern.index().of('function').by( { pattern: { index: -1 } } );

        assert.equal( index, -1 );
    });
});

}(requirejs, require);