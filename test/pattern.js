var should = require('chai').should(),
    assert = require('chai').assert,
    requirejs = require('requirejs');


;!function (require, nodeRequire) {

require.config({
    nodeRequire: nodeRequire
});

var Pattern = require('../src/Pattern.js');

describe('Pattern', function(){
    it('parse string without function pattern correctly', function(){
        var tester = '(+86) 18653139979';
        var pattern = Pattern.parse( tester );
        var items = pattern.items;
        
        for( var i = 0; i < items.length; i++ ) {
            assert.equal(items[i].type, 1);
            assert.equal(items[i].value, tester.charAt(i));
        }
    });

    /* Normal Parsing Cases */

    it('parse string with function pattern without parameter correctly', function(){
        var pattern = Pattern.parse('(+86) {d}{dddddddddd}');
        
        assert.deepEqual(pattern.items, [ 
            { type: 1, value: '(' },
            { type: 1, value: '+' },
            { type: 1, value: '8' },
            { type: 1, value: '6' },
            { type: 1, value: ')' },
            { type: 1, value: ' ' },
            { type: 2, value: 'd', param: '' },
            { type: 2, value: 'd', param: '' },
            { type: 2, value: 'd', param: '' },
            { type: 2, value: 'd', param: '' },
            { type: 2, value: 'd', param: '' },
            { type: 2, value: 'd', param: '' },
            { type: 2, value: 'd', param: '' },
            { type: 2, value: 'd', param: '' },
            { type: 2, value: 'd', param: '' },
            { type: 2, value: 'd', param: '' },
            { type: 2, value: 'd', param: '' } 
        ]);
    });

    it('parse string with function pattern and parameters correctly', function(){
        var pattern = Pattern.parse('(+86) {ddd(2345)dddddddd}');
        assert.deepEqual(pattern.items, [ 
            { type: 1, value: '(' },
            { type: 1, value: '+' },
            { type: 1, value: '8' },
            { type: 1, value: '6' },
            { type: 1, value: ')' },
            { type: 1, value: ' ' },
            { type: 2, value: 'd', param: '' },
            { type: 2, value: 'd', param: '' },
            { type: 2, value: 'd', param: '2345' },
            { type: 2, value: 'd', param: '' },
            { type: 2, value: 'd', param: '' },
            { type: 2, value: 'd', param: '' },
            { type: 2, value: 'd', param: '' },
            { type: 2, value: 'd', param: '' },
            { type: 2, value: 'd', param: '' },
            { type: 2, value: 'd', param: '' },
            { type: 2, value: 'd', param: '' } 
        ]);
        
    });

    it('parse string with multiple function pattern and parameters correctly', function(){
        var pattern = Pattern.parse('(+86) {ddd(2345)ddd} - {dd(25)ddd}');
        assert.deepEqual(pattern.items, [ 
            { type: 1, value: '(' },
            { type: 1, value: '+' },
            { type: 1, value: '8' },
            { type: 1, value: '6' },
            { type: 1, value: ')' },
            { type: 1, value: ' ' },
            { type: 2, value: 'd', param: '' },
            { type: 2, value: 'd', param: '' },
            { type: 2, value: 'd', param: '2345' },
            { type: 2, value: 'd', param: '' },
            { type: 2, value: 'd', param: '' },
            { type: 2, value: 'd', param: '' },
            { type: 1, value: ' ' },
            { type: 1, value: '-' },
            { type: 1, value: ' ' },
            { type: 2, value: 'd', param: '' },
            { type: 2, value: 'd', param: '25' },
            { type: 2, value: 'd', param: '' },
            { type: 2, value: 'd', param: '' },
            { type: 2, value: 'd', param: '' } 
        ]);
        
    });

    /* Exceptions */

    it('throw exception when function pattern did not close.', function(){
        var msg = '';

        try {
            Pattern.parse('(+86) {ddd(2345)dddddddd');
        }
        catch(ex) {
            msg = ex.message;
        }

        assert.include( msg,  "Syntax error: Expect a '}':23" );
    });

    it('throw exception when function pattern did not close (multiple function pattern).', function(){
        var msg = '';

        try {
            Pattern.parse('(+86) {ddd(2345)} -{dddddddd');
        }
        catch(ex) {
            msg = ex.message;
        }

        assert.include( msg,  "Syntax error: Expect a '}':27" );
    });

    it('throw exception when parameter pattern did not close.', function(){
        var msg = '';

        try {
            Pattern.parse('(+86) {ddd(2345dddddddd}');
        }
        catch(ex) {
            msg = ex.message;
        }

        assert.include( msg,  "Syntax error: Expect a ')':23" );
    });

    /* Matches & Applications */
    it('throw exception when parameter pattern did not close.', function(){
        var msg = '';
        var p;

        try {
            p = Pattern.parse("({11}) {99ddd}-{dddd}");
        }
        catch(ex) {
            msg = ex.message;
        }

        assert.include( msg,  "Syntax error: Expect a ')':23" );
    });
});
    
}(requirejs, require);