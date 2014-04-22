var should = require('chai').should(),
    assert = require('chai').assert,
    requirejs = require('requirejs');


;!function (require, nodeRequire) {

require.config({
    nodeRequire: nodeRequire
});

var Pattern = require('../src/Pattern.js');

describe('PatternFunction.digit', function(){

    /* Pattern Function */

    var ERROR_RUNTIME = 'Runtime error: ';

    it('can verify against any digit or specified digit', function(){
        var msg = '';
        var p;

        p = Pattern.parse("{1234567890}-{dddddddddd}");

        var result = p.apply("12345678901234567890");

        assert.deepEqual( result,  { 
            result: '1234567890-1234567890',
            matched: true,
            legitimate: true,
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
                legitimate: false,
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
                    legitimate: false,
                    counts: { total: 1, matched: 0 },
                    toString: result.toString
                } );
            }
        }
    });

    it('can verify against any selected digit set', function(){
        var msg = '';
        var p;
        var correctResult = {
            1: true,
            2: true,
            3: true,
            7: true,
            8: true,
            9: true
        };

        p = Pattern.parse("{d(123789)}");

        for( var i = 0; i < 10; i++ ) {
            var result = p.apply(i);
            assert.deepEqual( result,  { 
                result: correctResult[i]?i+'':' ',
                matched: correctResult[i]?true:false,
                legitimate: correctResult[i]?true:false,
                counts: { total: 1, matched: correctResult[i]?1:0 },
                toString: result.toString
            } );
        }

    });

    it('can verify against any selected digit range', function(){
        var msg = '';
        var p;
        var correctResult = {
            1: true,
            2: true,
            3: true
        };

        p = Pattern.parse("{d(1-3)}");

        for( var i = 0; i < 10; i++ ) {
            var result = p.apply(i);
            assert.deepEqual( result,  { 
                result: correctResult[i]?i+'':' ',
                matched: correctResult[i]?true:false,
                legitimate: correctResult[i]?true:false,
                counts: { total: 1, matched: correctResult[i]?1:0 },
                toString: result.toString
            } );
        }

    });

    /* (=) */

    it('can verify against previous digit, return match if they are the same', function(){
        var p;

        p = Pattern.parse("{d}-{d(=)}");

        var result = p.apply('33');
        assert.deepEqual( result,  { 
            result: '3-3',
            matched: true,
            legitimate: true,
            counts: { total: 2, matched: 2 },
            toString: result.toString
        } );

    });

    it('can verify against previous digit, return unmatch if they are not the same', function(){
        var p;

        p = Pattern.parse("{d}-{d(=)}");

        var result = p.apply('32');
        assert.deepEqual( result,  { 
            result: '3- ',
            matched: false,
            legitimate: false,
            counts: { total: 2, matched: 1 },
            toString: result.toString
        } );

    });

    it('can verify against previous digit, return unmatch if there is no previous digit element', function(){
        var p;

        p = Pattern.parse("{a}-{d(=)}");

        var result = p.apply('a2');
        assert.deepEqual( result,  { 
            result: 'a- ',
            matched: false,
            legitimate: false,
            counts: { total: 2, matched: 1 },
            toString: result.toString
        } );

    });

    it('return unmatched if d(=) is the first matching element', function(){
        var p;

        p = Pattern.parse("-{d(=)}-");

        var result = p.apply('2');
        assert.deepEqual( result,  { 
            result: '- -',
            matched: false,
            legitimate: false,
            counts: { total: 1, matched: 0 },
            toString: result.toString
        } );
        
    });

    /* (+N) */

    it('can verify against previous digit, return match if current digit = previous digit + 1', function(){
        var p;

        p = Pattern.parse("{d}-{d(+1)}");

        var result = p.apply('12');
        assert.deepEqual( result,  { 
            result: '1-2',
            matched: true,
            legitimate: true,
            counts: { total: 2, matched: 2 },
            toString: result.toString
        } );

    });

    it('can verify against previous digit, return match if current digit = previous digit + 1 (shorthand)', function(){
        var p;

        p = Pattern.parse("{d}-{d(+)}");

        var result = p.apply('12');
        assert.deepEqual( result,  { 
            result: '1-2',
            matched: true,
            legitimate: true,
            counts: { total: 2, matched: 2 },
            toString: result.toString
        } );

    });

    it('can verify against previous digit, return unmatch if current digit != previous digit + 1', function(){
        var p;

        p = Pattern.parse("{d}-{d(+1)}");

        var result = p.apply('02');
        assert.deepEqual( result,  { 
            result: '0- ',
            matched: false,
            legitimate: false,
            counts: { total: 2, matched: 1 },
            toString: result.toString
        } );

    });

    it('can verify against previous digit, return unmatch if current digit != previous digit + 1 (shorthand)', function(){
        var p;

        p = Pattern.parse("{d}-{d(+)}");

        var result = p.apply('02');
        assert.deepEqual( result,  { 
            result: '0- ',
            matched: false,
            legitimate: false,
            counts: { total: 2, matched: 1 },
            toString: result.toString
        } );

    });

    it('can verify against previous digit with param "+", return unmatch if previous already largest', function(){
        var p;

        p = Pattern.parse("{d}-{d(+1)}");

        var result = p.apply('910');
        assert.deepEqual( result,  { 
            result: '9- ',
            matched: false,
            legitimate: false,
            counts: { total: 3, matched: 1 },
            toString: result.toString
        } );

    });

    it('can verify against previous digit, return match if current digit = previous digit + N', function(){
        var p;

        p = Pattern.parse("{d}-{d(+3)}");

        var result = p.apply('14');
        assert.deepEqual( result,  { 
            result: '1-4',
            matched: true,
            legitimate: true,
            counts: { total: 2, matched: 2 },
            toString: result.toString
        } );

    });

    it('can verify against previous digit, return unmatch if current digit != previous digit + N', function(){
        var p;

        p = Pattern.parse("{d}-{d(+3)}");

        var result = p.apply('34');
        assert.deepEqual( result,  { 
            result: '3- ',
            matched: false,
            legitimate: false,
            counts: { total: 2, matched: 1 },
            toString: result.toString
        } );

    });

    it('return unmatched if d(+) is the first matching element', function(){
        var p;

        p = Pattern.parse("-{d(+)}-");

        var result = p.apply('2');
        assert.deepEqual( result,  { 
            result: '- -',
            matched: false,
            legitimate: false,
            counts: { total: 1, matched: 0 },
            toString: result.toString
        } );
        
    });

    /* (-N) */

    it('can verify against previous digit, return match if current digit = previous digit - 1', function(){
        var p;

        p = Pattern.parse("{d}-{d(-1)}");

        var result = p.apply('10');
        assert.deepEqual( result,  { 
            result: '1-0',
            matched: true,
            legitimate: true,
            counts: { total: 2, matched: 2 },
            toString: result.toString
        } );

    });

    it('can verify against previous digit, return match if current digit = previous digit - 1 (shorthand)', function(){
        var p;

        p = Pattern.parse("{d}-{d(-)}");

        var result = p.apply('10');
        assert.deepEqual( result,  { 
            result: '1-0',
            matched: true,
            legitimate: true,
            counts: { total: 2, matched: 2 },
            toString: result.toString
        } );

    });

    it('can verify against previous digit, return unmatch if current digit != previous digit - 1', function(){
        var p;

        p = Pattern.parse("{d}-{d(-1)}");

        var result = p.apply('00');
        assert.deepEqual( result,  { 
            result: '0- ',
            matched: false,
            legitimate: false,
            counts: { total: 2, matched: 1 },
            toString: result.toString
        } );

    });

    it('can verify against previous digit, return unmatch if current digit != previous digit - 1 (shorthand)', function(){
        var p;

        p = Pattern.parse("{d}-{d(-)}");

        var result = p.apply('02');
        assert.deepEqual( result,  { 
            result: '0- ',
            matched: false,
            legitimate: false,
            counts: { total: 2, matched: 1 },
            toString: result.toString
        } );

    });

    it('can verify against previous digit with param "+", return unmatch if previous already smallest', function(){
        var p;

        p = Pattern.parse("{d}-{d(+1)}");

        var result = p.apply('0-1');
        assert.deepEqual( result,  { 
            result: '0- ',
            matched: false,
            legitimate: false,
            counts: { total: 3, matched: 1 },
            toString: result.toString
        } );

    });

    it('can verify against previous digit, return match if current digit = previous digit - N', function(){
        var p;

        p = Pattern.parse("{d}-{d(-6)}");

        var result = p.apply('71');
        assert.deepEqual( result,  { 
            result: '7-1',
            matched: true,
            legitimate: true,
            counts: { total: 2, matched: 2 },
            toString: result.toString
        } );

    });

    it('can verify against previous digit, return unmatch if current digit != previous digit - N', function(){
        var p;

        p = Pattern.parse("{d}-{d(-6)}");

        var result = p.apply('70');
        assert.deepEqual( result,  { 
            result: '7- ',
            matched: false,
            legitimate: false,
            counts: { total: 2, matched: 1 },
            toString: result.toString
        } );

    });

    it('return unmatched if d(-) is the first matching element', function(){
        var p;

        p = Pattern.parse("-{d(-)}-");

        var result = p.apply('2');
        assert.deepEqual( result,  { 
            result: '- -',
            matched: false,
            legitimate: false,
            counts: { total: 1, matched: 0 },
            toString: result.toString
        } );
        
    });

    /* (?) */

    it('returns match when input is empty and the pattern is set to d(?) ', function(){
        var p;

        p = Pattern.parse("-{dd(?)}-");

        var result = p.apply('2');
        assert.deepEqual( result,  { 
            result: '-2 -',
            matched: true,
            legitimate: true,
            counts: { total: 1, matched: 1 },
            toString: result.toString
        } );
        
    });

    it('returns matched when input is empty and the pattern is set to d(?) ', function(){
        var p;

        p = Pattern.parse("-{dd(?)}-");

        var result = p.apply('2');
        assert.deepEqual( result,  { 
            result: '-2 -',
            matched: true,
            legitimate: true,
            counts: { total: 1, matched: 1 },
            toString: result.toString
        } );
        
    });

    it('returns matched when input is any number and the pattern is set to d(?) ', function(){
        var p;

        p = Pattern.parse("-{dd(?)}-");

        var result = p.apply('23');
        assert.deepEqual( result,  { 
            result: '-23-',
            matched: true,
            legitimate: true,
            counts: { total: 2, matched: 2 },
            toString: result.toString
        } );
        
    });

    it('returns unmatched when input is any alphabet and the pattern is set to d(?) ', function(){
        var p;

        p = Pattern.parse("-{dd(?)}-");

        var result = p.apply('2a');
        assert.deepEqual( result,  { 
            result: '-2 -',
            matched: false,
            legitimate: false,
            counts: { total: 2, matched: 1 },
            toString: result.toString
        } );
        
    });

    /* Exceptions */

    it('throw exception if there is alpahbet in the parameter', function(){
        var p;

        p = Pattern.parse("{d(23a)}");

        try {
            var result = p.apply('3');
        }
        catch(ex) {
            assert.equal(ex.message, ERROR_RUNTIME + "Not a correct parameter format:0");
            return;
        }

        assert.fail('Exception not thrown', 'exception');
        
    });

    it('throw exception if there is alpahbet range in the parameter', function(){
        var p;

        p = Pattern.parse("{d(a-z)}");

        try {
            var result = p.apply('3');
        }
        catch(ex) {
            assert.equal(ex.message, ERROR_RUNTIME + "Not a correct parameter format:0");
            return;
        }

        assert.fail('Exception not thrown', 'exception');
        
    });

    it('throw exception if the N in d(+N) is larger than 9', function(){
        var p;

        p = Pattern.parse("{dd(+10)}");

        try {
            var result = p.apply('09');
        }
        catch(ex) {
            assert.equal(ex.message, ERROR_RUNTIME + 'Expect the range to be 0-9:1');
            return;
        }

        assert.fail('Exception not thrown', 'exception');
        
    });


    it('throw exception if the N in d(-N) is larger than 9', function(){
        var p;

        p = Pattern.parse("{dd(-10)}");

        try {
            var result = p.apply('09');
        }
        catch(ex) {
            assert.equal(ex.message, ERROR_RUNTIME + 'Expect the range to be 0-9:1');
            return;
        }

        assert.fail('Exception not thrown', 'exception');
        
    });
});
    
}(requirejs, require);