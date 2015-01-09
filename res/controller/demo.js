define(['require', '$'], function (require, $) {

    'use strict';

    function init( options ){
        var Chuanr = options.Chuanr;
        var isDebug = options.isDebug;

        function showPatterns(){
            var tips = $('.tip');
            var l;

            function loop(){
                var cur = creationInfo[l];
                var curTip = tips[l];

                if ( curTip == null ) {
                    return;
                }

                var text = cur.instance.patterns.toString().replace(/,/g, ',\n');

                curTip.style.display = 'block';
                curTip.style.height = 'auto';
                curTip.style.opacity = '1';

                if ( 'innerText' in curTip ) {
                    curTip.innerText = text;
                }
                else {
                    curTip.textContent = text;
                }

                var height = curTip.clientHeight;

                curTip.style.height = '0';
                curTip.style.opacity = '0';

                setTimeout(function(){
                    if ( 'opacity' in curTip.style ) {
                        curTip.style.opacity = '1';
                        curTip.style.height = height + 'px';
                    }
                }, 0);

            }

            for( l = creationInfo.length; l--; ) {
                loop();
            }
        }
        
        function hidePatterns(){
            var tips = $('.tip');
            for(var l = tips.length; l--;){
                tips[l].style.display = 'none';
            }
        }

        function scheduleErrorClear(elInput){
            if ( schHandle ) {
                clearTimeout( schHandle );
                schHandle = null;
            }
            schHandle = setTimeout(function(){
                elInput.className = elInput.className.replace('error','');
            }, 1000);
        }

        function getOnResume(elInput){
            return function(){
                // settimeout to workaround ie bug
                elInput.className = '';
                $elMessageBox
                    .parent()
                        .parent()
                            .css({
                                opacity: '0'
                            });
            };
        }

        function getOnPrevent(elInput) {
            return function onPrevent(format){
                var curItem;
                var i;
                var genericPattern = Chuanr.setting.Pattern.parse(
                    format.pattern.pattern + '{*}'
                );

                for(i = 0; i < genericPattern.items.length; i++) {
                    curItem = genericPattern.items[i];
                    if ( curItem.type == 2 ) {
                        curItem.param = '';
                        curItem.value = '*';
                    }
                }

                var genericFormatter = new Chuanr.setting.Formatter([genericPattern]);

                var input = format.input.replace(/[\(\){}\-\ ]/g, '');

                for(i = 0; i < input.length; i++){
                    genericFormatter.input(input.charAt(i));    
                }

                var output = genericFormatter.output();
                var msg = '"' + ( output.result + '' ).replace(/(\d)(\W*)$/,'<span class="highlight">$1</span>$2')  + '" is not an valid input for current field!';
                if ( window.console ) {
                    window.console.error('Prevented!! ' + msg);
                } 

                $elMessageBox
                    .text(msg)
                    .parent()
                        .parent()
                            .css({
                                opacity: '1'
                            });

                elInput.className = 'error shake animated';
                scheduleErrorClear(elInput);
                hidePatterns();
            };
        }

        function createChuanr() {
            var cur, inst;

            function bind(el, inst){
                el.onblur = function() {
                    if ( inst.intact() ) {
                        el.className += ' success';
                    }
                };
                el.onfocus = function() {
                    el.className = el.className.replace(' success', '');
                };
            }

            for( var l = creationInfo.length; l--; ) {
                cur = creationInfo[l];
                inst = cur.instance;

                if ( inst ) {
                    inst.dispose();
                }

                inst = new Chuanr({
                    placeholder: {
                        empty: chkUnderline.checked ? '_' : ' ',
                        always: cur.config && cur.config.placeholder && cur.config.placeholder.always
                    }
                });

                inst.roast( cur.el, cur.patterns );
                inst.on('prevented', getOnPrevent(cur.el));
                inst.on('resumed', getOnResume(cur.el));

                bind(cur.el, inst);

                cur.instance = inst;
            }
        }

        var schHandle;
        var elInput = document.getElementById('phone');
        var elFirstName = document.getElementById('firstname');
        var elLastName = document.getElementById('lastname');
        var elCreditcard = document.getElementById('creditcard');
        var $elMessageBox = $('#message-box');
        var elBtnPatterns = document.getElementById('btn-patterns');
        var elBtnCheck = document.getElementById('btn-check');
        var chkUnderline = document.getElementById('chk-placeholder');
        var elForm = document.getElementById('form');
        var namePatterns = [];

        (function( pttns ){
            for(var i = 3; i < 20; i++ ) {
                var sPttn = '{';
                for(var j = 0; j < i ; j++ ) {
                    sPttn+='a';
                }
                sPttn +='}';
                pttns.push(sPttn);
            }
        })(namePatterns);
            
        var creationInfo = [
            {
                'el': elFirstName,
                'patterns': namePatterns
            },
            {
                'el': elLastName,
                'patterns': namePatterns
            },
            {
                'el': elInput,
                'patterns': [
                    '({11}) {99ddd}-{dddd}',
                    '({11}) {98d}-{ddd}-{ddd}',
                    '({11}) {97d(01234569)dd}-{dddd}',
                    '({11}) {96ddd}-{dddd}',
                    '({11}) {95ddd}-{dddd}',
                    '({dd}) {700d}-{dddd}',
                    '({dd}) {7010}-{dddd}',
                    '({dd}) {77dd}-{dddd}',
                    '({dd}) {78dd}-{dddd}',
                    '({dd}) {790d(124)}-{dddd}',
                    '({dd}) {791d(2-9)}-{dddd}',
                    '({dd}) {792d(03489)}-{dddd}',
                    '({dd}) {793d(012456789)}-{dddd}',
                    '({dd}) {794d}-{dddd}',
                    '({11}) {d(2345)ddd}-{dddd}',
                    '-|({11}) {d(2345)d(+1)d(+1)d(+1)}-{d(+1)d(+1)}',
                    '_|{1199dd(+)d(+)d(?)d(?)d(?)d(?)}'
                ],
                'config': {
                    placeholder: {
                        always: true
                    }
                }
            },
            {
                'el': elCreditcard,
                'patterns': [
                    // AMEX
                    '{34ddd}-{ddddd}-{ddddl}',
                    '{37ddd}-{ddddd}-{ddddl}',
                    // DINERS CLUB - CARTE BLANCHE
                    '{30d(0-5)dd}-{ddddd}-{dddl}',
                    // DINERS CLUB - INTERNATIONAL
                    '{36ddd}-{ddddd}-{dddl}',
                    // DINERS CLUB - USA & CANADA
                    '{54dd}-{dddd}-{dddd}-{dddl}',
                    // DISCOVER
                    '{64d(4-9)d}-{dddd}-{dddd}-{dddl}',
                    '{65dd}-{dddd}-{dddd}-{dddl}',
                    '{6011}-{dddd}-{dddd}-{dddl}',
                    '{622d(1-9)}-{dddd}-{dddd}-{dddl}',
                    // INSTAPAYMENT
                    '{63d(7-9)d}-{dddd}-{dddd}-{dddl}',
                    // JCB
                    '{35d(2-8)d}-{dddd}-{dddd}-{dddl}',
                    // LASER
                    '{6304}-{dddd}-{dddd}-{dddd???}',
                    '{6706}-{dddd}-{dddd}-{dddd???}',
                    '{6771}-{dddd}-{dddd}-{dddd???}',
                    '{6709}-{dddd}-{dddd}-{dddd???}',
                    // MAESTRO
                    '{5018}-{dddd}-{dddd}-{dddd???}',
                    '{5020}-{dddd}-{dddd}-{dddd???}',
                    '{5038}-{dddd}-{dddd}-{dddd???}',
                    '{5893}-{dddd}-{dddd}-{dddd???}',
                    '{6304}-{dddd}-{dddd}-{dddd???}',
                    '{6759}-{dddd}-{dddd}-{dddd???}',
                    '{6761}-{dddd}-{dddd}-{dddd???}',
                    '{6762}-{dddd}-{dddd}-{dddd???}',
                    '{6763}-{dddd}-{dddd}-{dddd???}',
                    // MASTERCARD
                    '{5d(1-5)dd}-{dddd}-{dddd}-{dddl}',
                    '{5d(1-5)dd}-{dddd}-{dddd}-{ddddl}',
                    '{5d(1-5)dd}-{dddd}-{dddd}-{dddddl}',
                    '{5d(1-5)dd}-{dddd}-{dddd}-{ddddddl}',
                    // VISA
                    '{4ddd}-{dddd}-{dddd}-{l}',
                    '{4ddd}-{dddd}-{dddd}-{dl}',
                    '{4ddd}-{dddd}-{dddd}-{ddl}',
                    '{4ddd}-{dddd}-{dddd}-{dddl}',
                    // Visa Electron
                    '{4026}-{dddd}-{dddd}-{dddl}',
                    '{4175}-{00dd}-{dddd}-{dddl}',
                    '{4508}-{dddd}-{dddd}-{dddl}',
                    '{4844}-{dddd}-{dddd}-{dddl}',
                    '{4913}-{dddd}-{dddd}-{dddl}',
                    '{4917}-{dddd}-{dddd}-{dddl}',
                ]
            }
        ];
        
        elBtnPatterns.onclick = function() {
            showPatterns();
        };
        $(elForm).on('submit', function ( evt ) {
            var allFine = true;

            for( var l = creationInfo.length; l--; ) {
                if ( creationInfo[l].instance.intact() !== true ) {
                    allFine = false;
                }
            }

            if ( allFine ) {
                elBtnCheck.className = 'validate';
            }
            else {
                elBtnCheck.className = 'error';   
                evt.preventDefault();
            }

        });
        chkUnderline.onchange = function(){
            createChuanr();
        };
        createChuanr();

        if ( isDebug ) {
            require(['../../src/util', '../../lib/xinput/XInput', '../../src/shim/console'], 
                function( util, InputObserver, console ){
                // for testing
                var oninput = new InputObserver();
                oninput.observe(elInput);
                oninput.oninput = function(){
                    console.log('xoninput "' + elInput.value + '"');
                };
                util.addListener(elInput, 'keydown', function(evt){
                    console.log('onkeydown: keyCode', evt.keyCode);
                });
                util.addListener(elInput, 'keypress', function(evt){
                    console.log('onkeypress: charCode', evt.charCode || evt.keyCode);
                });
                util.addListener(elInput, 'input', function(){
                    console.log('oninput "' + elInput.value + '"');
                });
                util.addListener(elInput, 'propertychange', function(evt){
                    console.log('onpropertychange', evt.propertyName);
                });
                util.addListener(elInput, 'keyup', function(evt){
                    console.log('onkeyup "' + evt.keyCode + '"');
                });
                var MutationObserver = window.MutationObserver || window.webkitMutationObserver;
                if ( MutationObserver ) {
                    var observer = new MutationObserver(function(mutations){
                        mutations.forEach(function(mutation){
                            console.log('Mutation: ' , mutation);
                        });
                    });
                    observer.observe(elInput, { attributes: true, childList: true, characterData: true, subtree: true, attributeOldValue: true });
                    // observer.disconnect();
                }
            });
        }
    }

    return {
        init: init
    };
});