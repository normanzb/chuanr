require({
    paths: {
        '$': './res/jquery'
    },
    shim: {
        '$': {
            exports: 'jQuery'
        }
    }
}, 
['$', './res/loader'], 
function($, loader){
    'use strict';

    $(function(){
        loader.load();
    });
    
});