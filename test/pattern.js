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
    it('return matched when input partially match a positive pattern.', function(){
        var msg = '';
        var p;

        p = Pattern.parse("({11}) {99ddd}-{dddd}");

        var result = p.apply("1199386");

        assert.deepEqual( result,  { 
            result: '(11) 99386-    ',
            matched: true,
            counts: { total: 7, matched: 7 },
            toString: result.toString
        } );
    });

    it('return matched when input fully match a positive pattern.', function(){
        var msg = '';
        var p;

        p = Pattern.parse("({11}) {99ddd}-{dddd}");

        var result = p.apply("11993863845");

        assert.deepEqual( result,  { 
            result: '(11) 99386-3845',
            matched: true,
            counts: { total: 11, matched: 11 },
            toString: result.toString
        } );
    });

    it('return unmatched when a fully matched input appended a char (so it makes the input longer than pattern length)', function(){
        var msg = '';
        var p;

        p = Pattern.parse("({11}) {99ddd}-{dddd}");

        var result = p.apply("119938638458");

        assert.deepEqual( result,  { 
            result: '(11) 99386-3845',
            matched: false,
            counts: { total: 12, matched: 11 },
            toString: result.toString
        } );
    });

    it('can verify against any digit or specified digit', function(){
        var msg = '';
        var p;

        p = Pattern.parse("{1234567890}-{dddddddddd}");

        var result = p.apply("12345678901234567890");

        assert.deepEqual( result,  { 
            result: '1234567890-1234567890',
            matched: true,
            counts: { total: 20, matched: 20 },
            toString: result.toString
        } );
    });

    it('can verify against any digit or specified digit (negative case)', function(){
        var msg = '';
        var p;
        var indexCapA = 65;
        var indexA = 97;
        var numberOfAlphabet = 26;

        p = Pattern.parse("{d}");

        for( var i = 0; 
            i < indexA + numberOfAlphabet - indexCapA;
            i++ ) {
            
            var result = p.apply( String.fromCharCode( i + indexCapA ) );

            assert.deepEqual( result,  { 
                result: " ",
                matched: false,
                counts: { total: 1, matched: 0 },
                toString: result.toString
            } );
        }

        for ( var j = 0; j < 10; j++ ) {
            p = Pattern.parse("{" + j + "}");

            for( var i = 0; i < 10 ; i++ ) {

                if ( i == j ) {
                    continue;
                }

                var result = p.apply(i);

                assert.deepEqual( result,  { 
                    result: " ",
                    matched: false,
                    counts: { total: 1, matched: 0 },
                    toString: result.toString
                } );
            }
        }
    });
});
    
}(requirejs, require);