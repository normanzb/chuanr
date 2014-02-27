
if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(['./Formatter', './Pattern', './util', './caret', '../lib/boe/src/boe/Function/bind', '../lib/boe/src/boe/String/trim', './shim/console'], 
    function ( Formatter, Pattern, util, caretUtil, bind, trim, console ) {

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

        console.hr();

        var original;

        this._keyCode = evt.keyCode;
        this._caret = caretUtil.get( this._el );
        this._charCode = null;

        if ( this.isFormatted ) {
            // do a filtering before actual inputting
            original = trim.call( this.formatter.extract( this._el.value ) );

            console.log( 'Caret before update: ', this._caret );

            // calculate the original caret position
            this._caret.begin = this.formatter
                .index()
                    .of('function')
                    .by({ pattern: { index: this._caret.begin } });
            this._caret.end = this.formatter
                .index()
                    .of('function')
                    .by({ pattern: { index: this._caret.end } });

            // means actually at the end of input
            if ( this._caret.begin < 0 || this._caret.begin > original.length ) {
                this._caret.begin = original.length;
            }
            if ( this._caret.end < 0 || this._caret.end > original.length ) {
                this._caret.end = original.length;
            }

            console.log( 'Original input extracted: "' + original + '"' , 'Updated caret: ', this._caret );

            this._el.value = original;
        }

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
        if ( this._requireHandleInput && 
            // if below check == true, means keyDown happen but keypress never happen, 
            // quite possible it is a undo
            this._requireHandlePress != true ) {

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

            console.hr();

            // that means the change is done by pasting, dragging ...etc
            var value = this._el.value;

            console.log ( 'Input Type: Batch: ', value );

            this.formatter.reset( value );

            render.call(this);

        }
    }

    function render( input ) {

        var caret = {
            begin: 0,
            end: 0
        };
        var caretMove = true;

        if ( input ) {
            caret = input.caret;
            this.formatter.input( input );
        }
        else {
            caret = caretUtil.get( this._el );
        }

        var format = this.formatter.output();

        // check if we need to move caret
        if ( format.result.matched == false ) {
            console.log('Failed to format, undo.')
            caretMove = false;
            format = this.formatter.undo();
        }
        else {
            if ( this._untouched && input == null ) {
                // check if current value is shorter than previous value in batch mode
                if ( this._untouched.result.toString().length > this._el.value.length ) {
                    // a delete operation? don't move caret
                    caretMove = false;
                }
            }
            else if ( input && ( input.del || input.back ) ) {
                caretMove = false;
                caret.begin -= 1;
                caret.end -= 1;
            }
        }

        console.log('Move caret? ', caretMove);

        if ( format.result.toString() == null ) {
            console.warn('Revert, this should never happen?');
            // revert to original value
            format = this._untouched;
        }
        this._untouched = format;

        console.log( 'Final Format', format.result.toString(), format );

        // update the element
        this._el.value = format.result;

        console.log('Caret before input: ', caret );

        caret.begin = this.formatter
            .index()
                .of('pattern')
                .by({ function: { index: caret.begin + ( caretMove ? 1 : 0 ) } });
        if ( caret.begin < 0 ) {
            caret.begin = this._el.value.length;
        }

        console.log('Caret after format: ', caret);

        // set cursor
        caretUtil.set( this._el, caret.begin );

        this.isFormatted = true;

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

        if ( this._el.value != "" ) {
            // not equal to empty spaces
            onInput.call(this);
        }

    };

    // expose ioc setting
    Ctor.setting = ioc;

    return Ctor;
});