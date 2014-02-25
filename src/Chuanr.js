
if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(['./Formatter', './Pattern', './util', './caret', '../lib/boe/src/boe/Function/bind', './shim/console'], 
    function ( Formatter, Pattern, util, caret, bind, console ) {

    // settings
    var ioc = {
        Formatter: Formatter,
        Pattern: Pattern
    };

    /* Private Methods */
    function onKeyDown ( evt ) {

        if ( util.isAcceptableKeyCode( evt.keyCode ) == false || util.isModifier( evt ) ) {
            if ( util.isMovementKeyCode( evt.keyCode ) == false && util.isModifier( evt ) == false ) {
                evt.preventDefault();
            }
            
            this._requireHandlePress = false;
            this._requireHandleInput = false;
            return;
        }

        this._keyCode = evt.keyCode;
        this._caret = caret.get( this._el );
        this._charCode = null;

        if ( util.isDelKey( evt.keyCode ) == false && 
            util.isBackSpaceKey( evt.keyCode ) == false ) {
            this._requireHandlePress = true;
        }
        
        this._requireHandleInput = true;
    }

    function onKeyPress(evt) {
        if ( this._requireHandlePress == false ) {
            return;
        }

        this._charCode = evt.keyCode || evt.charCode;

        this._requireHandlePress = false;
    }

    function onInput(evt) {
        if ( this._requireHandleInput ) {

            console.log ( 'Input Type: Single: ', String.fromCharCode( this._charCode ) );

            render.call( this, {
                key: this._keyCode,
                char: this._charCode,
                del: util.isDelKey( this._keyCode ),
                back: util.isBackSpaceKey( this._keyCode ),
                caret: this._caret
            } );

            this._requireHandlePress = false;
            this._requireHandleInput = false;
            
        }
        else {

            // that means the change is done by pasting, dragging ...etc
            var value = this._el.value;

            console.log ( 'Input Type: Batch: ', value );

            this.formatter.reset( value );

            render.call(this);

        }
    }

    function render( input ) {

        if ( input ) {
            this.formatter.input( input );
        }

        var format = this.formatter.output();

        if ( format == null ) {

            // revert to original value
            format = this._untouched;

        }

        this._untouched = format;

        console.log( format );

    }

    /* Public Methods */
    function Ctor() {
        this.patterns = [];
        this.formatter = null;

        this._el = null;
        this._requireHandlePress = false;
        this._requireHandleInput = false;
        this._keyCode = null;
        this._charCode = null;
        this._caret = null;
        this._untouched = '';
        this.isFormatted = false;
    }

    var p = Ctor.prototype;

    /**
     * Bind Chuanr with specific input elment
     */
    p.roast = function (el, patterns) {

        if ( this._el != null ) {
            // TODO;
        }

        this._el = el;

        for( var i = 0 ; i < patterns.length; i++ ) {
            this.patterns.push( ioc.Pattern.parse( patterns[ i ] ) );
        }

        this.formatter = new ioc.Formatter(this.patterns);

        util.addListener(el, 'keydown', bind.call(onKeyDown, this));
        util.addListener(el, 'keypress', bind.call(onKeyPress, this));
        util.addListener(el, 'input', bind.call(onInput, this));

    };

    // expose ioc setting
    Ctor.setting = ioc;

    return Ctor;
});