define(['require', '$', './controller/demo'], function (require, $, demoController) {
    return {
        load: function(){
            $(function () {
                var isDebug = location.hash.indexOf('debug') > 0;
                require([ (isDebug ? '../src/Chuanr': '../Chuanr')], function(Chuanr){
                    demoController.init({
                        isDebug: isDebug,
                        Chuanr: Chuanr
                    })
                });
            });
        }
    } 
});