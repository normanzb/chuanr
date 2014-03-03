
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}

define(['./Formatter', 
    './Pattern', 
    './util', 
    './caret', 
    '../lib/boe/src/boe/Function/bind', 
    '../lib/boe/src/boe/String/trim', 
    '../lib/boe/src/boe/Object/clone', 
    '../lib/boe/src/boe/util', 
    '../lib/cogs/src/cogs/emittable',
    '../lib/cogs/src/cogs/event',
    './shim/oninput',
    './shim/console'], 
    function ( 
        Formatter, Pattern, util, caretUtil, 
        bind, trim, clone, boeUtil, 
        emittable, event, 
        InputObserver, console ) {

    // ioc settings
    var ioc = {
        Formatter: Formatter,
        Pattern: Pattern,
        InputObserver: InputObserver
    };

    var defaultSettings = {
        speculation: {
            batchinput: true
        }
    };

    /* Private Methods */
    function tryExtractAndResetCaret( value, caret ) {
        // do a filtering before actual inputting
        var original;

        try{
            original = trim.call( this.formatter.extract( value ) + '' );    
        }
        catch(ex){
            original = null;
        }

        if ( caret ){

            console.log( 'Caret before update: ', caret );

            // calculate the original caret position
            caret.begin = this.formatter
                .index()
                    .of('function')
                    .by({ pattern: { index: caret.begin } });
            caret.end = this.formatter
                .index()
                    .of('function')
                    .by({ pattern: { index: caret.end } });

            // means actually at the end of input
            if ( caret.begin < 0 || caret.begin > original.length ) {
                caret.begin = original.length;
            }
            if ( caret.end < 0 || caret.end > original.length ) {
                caret.end = original.length;
            }

            console.log( 'Original input extracted: "' + original + '"' , 'Updated caret: ', caret );

        }

        if ( original == 0 ) {
            this._isFormatted = false;
        }

        return original;
    }

    function speculateBatchInput( format ){

        var speculated, finalExtraction;

        console.log("Try to be smart, figure out what the user actually want to input");
        console.log("Step 1. Try Extract");

        speculated = tryExtractAndResetCaret.call( this, this._el.value, null );

        if ( speculated == null ) {

            console.log('Failed to extract.');
            console.log("Step 2. Try filter out puncuation and spaces.");

            speculated = this._el.value.replace(/\W/g,'');

            if ( speculated != 0 ) {
                speculated = trim.call( speculated );
                this._el.value = speculated;
                format = this.formatter.reset( this._el.value );
            }

            // give up
            
        }
        else {

            console.log('Extracted, use extrcted string.')

            speculated = trim.call( speculated );
            this._el.value = speculated;
            format = this.formatter.reset( this._el.value );

        }

        return format;
    }

    function onKeyDown( evt ) {

        if ( this._requireHandleKeyUp == true ) {
            // mean user keeps key down 
            // this is not allowed because it causes oninput never happen
            util.preventDefault(evt);
            return;
        }

        if ( util.isAcceptableKeyCode( evt.keyCode ) == false || util.isModifier( evt ) ) {
            if ( util.isMovementKeyCode( evt.keyCode ) == false && util.isModifier( evt ) == false ) {
                console.log('Key Down prevented')
                util.preventDefault(evt);
            }
            
            this._requireHandlePress = false;
            this._requireHandleInput = false;
            return;
        }

        console.hr();

        this._keyCode = evt.keyCode;
        this._caret = caretUtil.get( this._el );
        this._charCode = null;

        if ( this._isFormatted && 
            // in case user clear the input by X button or js function (which do not trigger oninput)
            this._el.value !== "" ) {
            this._el.value = tryExtractAndResetCaret.call( this, this._el.value, this._caret );
        }

        if ( util.isDelKey( evt.keyCode ) == false && 
            util.isBackSpaceKey( evt.keyCode ) == false ) {
            this._requireHandlePress = true;
        }
        
        this._requireHandleInput = true;
        this._requireHandleKeyUp = true;
    }

    function onKeyPress( evt ) {
        if ( this._requireHandlePress == false ) {
            return;
        }

        this._charCode = evt.keyCode || evt.charCode;

        this._requireHandlePress = false;
    }

    function onInput( ) {
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
            
        }
        else {

            console.hr();

            console.log ( 'Input Type: Batch: ', this._el.value );

            render.call(this);

        }

        this._requireHandlePress = false;
        this._requireHandleInput = false;
    }

    function onKeyUp( evt ) {
        // protection mechanism
        // some browsers (e.g. IE) doesn't support oninput
        // so we compulsorily make it here
        if ( this._requireHandleInput == true ) {
            console.log('Compulsorily call into onInput')
            onInput.call(this);
        }

        this._requireHandleKeyUp = false;
    }

    function render( input ) {

        var caret = {
            begin: 0,
            end: 0
        };
        var caretMove = true;
        var format;
        var undid = false;

        if ( input ) {
            // normal input
            caret = input.caret;
            this.formatter.input( input );
            format = this.formatter.output();
        }
        else {
            // that means the change is done by pasting, dragging ...etc
            format = this.formatter.reset( this._el.value );
            caret = caretUtil.get( this._el );
        }

        // get a matched format by trying different type of input
        if ( this.config.speculation.batchinput == true && 
            input == null && 
            format.result.matched == false ) {
            format = speculateBatchInput.call( this , format );
        }

        // check if we need to move caret
        if ( input ) {
            if ( format.result.matched == false ) {
                caretMove = false;
            }
            else if ( input.del || input.back ) {
                caretMove = false;
                if ( caret.begin > 0 ) {
                   caret.begin -= 1; 
                }
                if ( caret.end > 0 ) {
                    caret.end -= 1
                }
                
            }
        }
        else {
            // check if current value is shorter than previous value in batch mode
            if ( this._untouched && 
                this._untouched.result.toString().length > this._el.value.length ) {
                // a delete operation? don't move caret
                caretMove = false;
            }
        }

        // revert if match failed
        while ( format.result.matched == false ) {

            undid = format;
            format = this.formatter.undo()

            console.log('Failed to format, undo.');

            if ( format == null ) {
                console.log('Tried to undo, but failed.');
                break;
            }

            caret.begin = tryExtractAndResetCaret.call( this, format.result.toString(), null ).length;
            caret.end = caret.begin;
            caretMove = false;
        }

        if ( format == null ) {
            throw 'Boom, "format" is null, this should never happen.';
        }

        console.log('Move caret? ', caretMove);

        if ( format.result.toString() == null ) {
            console.warn('Revert, this should never happen?');
            // revert to original value
            format = this._untouched;
        }
        this._untouched = format;

        console.log( 'Final Format', format.result.toString() );

        // update the element
        this._el.value = format.result;

        // update the caret
        console.log('Caret before format: ', caret );

        caret.begin = this.formatter
            .index()
                .of('pattern')
                .by({ 'function': { index: caret.begin + ( caretMove ? 1 : 0 ) } });
        if ( caret.begin < 0 ) {
            caret.begin = this._el.value.length;
        }

        console.log('Caret after format: ', caret);

        // set cursor
        caretUtil.set( this._el, caret.begin );

        if ( format.result != 0 ) {
            this._isFormatted = true;
        }
        else {
            this._isFormatted = false;
        }

        // fire event
        if ( undid ) {
            this.onPrevented.invoke( undid );
        }
        else {
            this.onResumed.invoke( format );
        }

    }

    /* Public Methods */
    function Ctor( config ) {
        this.patterns = [];
        this.formatter = null;
        this.oninput = null;
        this.config = clone.call(defaultSettings, true);
        boeUtil.mixin( this.config, config );

        this._el = null;
        this._requireHandlePress = false;
        this._requireHandleInput = false;
        this._requireHandleKeyUp = false;
        this._keyCode = null;
        this._charCode = null;
        this._caret = null;
        this._untouched = '';
        this._isFormatted = false;

        this.onPrevented = event();
        this.onResumed = event();
        emittable( this );

    }

    var p = Ctor.prototype;

    /**
     * Bind Chuanr with specific input elment
     */
    p.roast = function (el, patterns) {

        if ( el == null || el.tagName.toUpperCase() != 'INPUT' ) {
            throw "Target input element must be specified.";
        }

        this._el = el;

        for( var i = 0 ; i < patterns.length; i++ ) {
            this.patterns.push( ioc.Pattern.parse( patterns[ i ] ) );
        }

        this.formatter = new ioc.Formatter(this.patterns);
        
        this.oninput = new InputObserver();
        this.oninput.observe(el);
        this.oninput.oninput = bind.call(onInput, this);

        util.addListener(el, 'keydown', bind.call(onKeyDown, this));
        util.addListener(el, 'keypress', bind.call(onKeyPress, this));
        util.addListener(el, 'keyup', bind.call(onKeyUp, this));

        if ( this._el.value != "" ) {
            // not equal to empty spaces
            onInput.call(this);
        }

    };

    // expose ioc setting
    Ctor.setting = ioc;

    return Ctor;
});