define(['$'], function($){
    'use strict';

    var $form;
    var $inpTest;
    var $txtPatterns;
    var $btnCheck;
    var Chuanr;
    var inst;

    function createChuanr(){
        var patterns = '';
        var newPatterns;

        if ( inst ) {
            inst.dispose();
            $inpTest.val('');
        }

        newPatterns = $txtPatterns.val();

        if ( newPatterns === patterns ) {
            return;
        }

        patterns = newPatterns.split('\n');

        for(var l = patterns.length; l--; ) {
            if ( patterns[l] === false ) {
                patterns.splice(l, 1);
            }
        }

        inst = new Chuanr();

        inst.roast( $inpTest[0], patterns );
    }

    function handleSubmit(evt){
        evt.preventDefault();

        if ( inst == null ) {
            return;
        }

        if ( inst.intact() ) {
            $btnCheck
                .removeClass('error')
                .addClass('success');
        }
        else {
            $btnCheck
                .addClass('error')
                .removeClass('success');
        }
    }

    function init(options) {
        Chuanr = options.Chuanr;

        $form = $('form.playground');
        $inpTest = $form.find('input.test');
        $txtPatterns = $('textarea.patterns');
        $btnCheck = $form.find('button');

        $form.on('submit', handleSubmit);
        $txtPatterns.on('blur', createChuanr);

        createChuanr();
    }

    return { init:init };
});