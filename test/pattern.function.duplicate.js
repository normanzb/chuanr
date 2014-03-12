var should = require('chai').should(),
    assert = require('chai').assert,
    requirejs = require('requirejs');


;!function (require, nodeRequire) {

require.config({
    nodeRequire: nodeRequire
});

var Pattern = require('../src/Pattern.js');

describe('PatternFunction.duplicate', function(){

    /* Pattern Function */

    it('duplicate previous pattern function', function(){
        var p;
        p = Pattern.parse("{dxx}-{xx}");

        var result = p.apply('12345');

        assert.deepEqual( result,  { 
            result: '123-45',
            matched: true,
            legitimate: true,
            counts: { total: 5, matched: 5 },
            toString: result.toString
        } );
    });

    it('duplicate previous pattern function and make the check optional if param = ?', function(){
        var p;
        p = Pattern.parse("{dxx}-{x(?)x(?)}");

        var result = p.apply('145', true);

        assert.deepEqual( result,  { 
            result: '145-',
            matched: true,
            legitimate: true,
            counts: { total: 5, matched: 5 },
            toString: result.toString
        } );
    });

    it('duplicate previous pattern function and make the check optional if param = ?, but it doesnot work in the middle', function(){
        var p;
        p = Pattern.parse("{dx(?)x(?)}-{xx}");

        var result = p.apply('145', true);

        assert.deepEqual( result,  { 
            result: '145-  ',
            matched: false,
            legitimate: false,
            counts: { total: 5, matched: 3 },
            toString: result.toString
        } );
    });

    it('duplicate previous pattern function and make the check optional if we use ? as function name', function(){
        var p;
        p = Pattern.parse("{dxx}-{??}");

        var result = p.apply('145', true);

        assert.deepEqual( result,  { 
            result: '145-',
            matched: true,
            legitimate: true,
            counts: { total: 5, matched: 5 },
            toString: result.toString
        } );
    });

    it('return falsed match correctly has using the alias "?"', function(){
        var p;
        p = Pattern.parse("-|{0d(=)d(=)d(=)d(=)}{????????????}");

        var result = p.apply('00000');

        assert.deepEqual( result,  { 
            result: '00000',
            matched: true,
            legitimate: false,
            counts: { total: 17, matched: 17 },
            toString: result.toString
        } );

        var result = p.apply('000001');

        assert.deepEqual( result,  { 
            result: '00000            ',
            matched: false,
            legitimate: true,
            counts: { total: 17, matched: 5 },
            toString: result.toString
        } );
    });

});

}(requirejs, require);