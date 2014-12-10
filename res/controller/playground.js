define(['$'], function($){
    'use strict';

    var $form;
    var $inpTest;
    var $txtPatterns;
    var $btnCheck;
    var Chuanr;

    function createChuanr(){
        var patterns = '';
        var inst;
        var newPatterns = $txtPatterns.text();

        if ( newPatterns === patterns ) {
            return;
        }

        patterns = newPatterns.split(',');

        for(var l = patterns.length; l--; ) {
            if ( patterns[l] == false ) {
                patterns.splice(l, 1);
            }
        }

        inst = new Chuanr();

        inst.roast( $inpTest[0], patterns );
    }

    function handleSubmit(evt){
        evt.preventDefault();
    }

    function init(options) {
        Chuanr = options.Chuanr;

        $form = $('form.playground');
        $inpTest = $form.find('input.test');
        $txtPatterns = $('textarea.patterns');

        $form.on('submit', handleSubmit);
        $txtPatterns.on('blur', createChuanr);

        createChuanr();
    }

    return { init:init };
});