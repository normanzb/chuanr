define([
    'require', 
    '$', 
    './controller/demo', 
    './controller/playground',
    './controller/link',
], 
function (require, $, demoController, playgroundController, linkController) {
    'use strict';

    return {
        load: function(){
            $(function () {
                var isDebug = location.hash.indexOf('debug') > 0;
                require([ (isDebug ? '../src/Chuanr': '../Chuanr')], function(Chuanr){
                    demoController.init({
                        isDebug: isDebug,
                        Chuanr: Chuanr
                    });
                    playgroundController.init({
                        isDebug: isDebug,
                        Chuanr: Chuanr
                    });
                    linkController.init({
                        isDebug: isDebug,
                        Chuanr: Chuanr
                    })
                });
            });
        }
    };
});