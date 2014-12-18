define(['$'], function ($) {
    'use strict';

    function init(){
        $('html')
            .on('click', '.link-to-github', function(evt){
                evt.preventDefault();
                var pathname = window.location.pathname;
                var username = (/(.*)?\.github\..*?$/).exec(window.location.hostname);
                if ( username == null || username.length <= 1 ) {
                    return;
                }
                username = username[1];
                window.location.href = 'http://github.com/' + username + pathname;
            });
    }

    return { init: init };
});