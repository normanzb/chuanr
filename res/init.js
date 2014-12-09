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

    $(function(){
        loader.load();
    });
    
});