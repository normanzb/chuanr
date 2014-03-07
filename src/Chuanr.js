
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}

define(['./Formatter', 
    './Pattern', 
    './util', 
    './caret', 
    './differ', 
    '../lib/boe/src/boe/Function/bind', 
    '../lib/boe/src/boe/String/trim', 
    '../lib/boe/src/boe/Object/clone', 
    '../lib/boe/src/boe/util', 
    '../lib/cogs/src/cogs/emittable',
    '../lib/cogs/src/cogs/event',
    './shim/oninput',
    './shim/console'], 
    function ( 
        Formatter, Pattern, util, caretUtil, differUtil,
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
        var original, extraction;

        try{
            console.log( "Do Extraction of '" + value + "'");
            extraction = this.formatter.extract( value );
            if ( extraction != null ) {
                original = trim.call( extraction + '' );
                console.log( "Exracted", original );
            }
        }
        catch(ex){
            original = null;
        }

        if ( original == null ) {
            console.log( "Extraction failed " );
        }

        if ( caret && original != null ){

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

    function extraRawData( input, caret ){
        var prev, ret, prevInput, begin, end, isConstantDeletion = false,
            prefix, postfix;

        console.log('Not raw data, need some sophisicated logic to figure out');

        prev = this._untouched ? this._untouched.result + '' : '';

        differ = differUtil.diff(
            prev, 
            input
        );

        console.log("Differ '" + prev + "':'" + input + "'", differ);

        extraction = this.formatter.extract( prev );

        if ( extraction == null ) {
            return ret;
        }

        prevInput = extraction + '';

        isSpaceDeletion = differ.insertion.caret.begin == differ.insertion.caret.end &&
            (
                extraction.pattern.items[caret.begin].type == 2 && 
                differ.deletion.text == ' '
            );

        isConstantDeletion = differ.insertion.caret.begin == differ.insertion.caret.end &&
            differ.deletion.text.length > 0 && 
            (
                extraction.pattern.items[caret.begin].type == 1
            );

        begin = extraction.pattern
            .index()
                .of('function')
                .by({ pattern: { index: differ.deletion.caret.begin }});
        end = extraction.pattern
            .index()
                .of('function')
                .by({ pattern: { index: differ.deletion.caret.end }})

        if ( isSpaceDeletion || isConstantDeletion ) {
            // quite possibly user deleted constant
            console.log("User deleted " + differ.deletion.text.length + "space/constant(s)");
            begin = extraction.pattern
                .index().of('function').by({ pattern: { index: caret.begin }}) - (isConstantDeletion?1:0);
        }

        prefix = prevInput.substring( 0, begin );
        postfix = prevInput.substring( end, prevInput.length + 1);

        // prefix.length - trim.call( prefix ).length 

        input = prefix + differ.insertion.text + postfix;
            
        if ( caret != null ) {
            if ( isSpaceDeletion || isConstantDeletion ) {
                caret.begin = begin;
                caret.end = caret.begin;
                caret.type = 2;
            }
            else {
                caret.begin = end + differ.insertion.text.length - differ.deletion.text.length;
                caret.end = caret.begin;
                caret.type = 2;
            }
        }

        console.log( 'Raw Input' , input, caret );

        ret = input;

        return ret;
    }

    function speculateBatchInput( input, format, caret ){

        var speculated, finalExtraction;

        console.log("Try to be smart, figure out what the user actually want to input");
        console.log("Speculation Step 1. Try Extract");
        speculated = tryExtractAndResetCaret.call( this, this._el.value, null );

        if ( speculated == null ) {

            console.log('Failed to extract.');
            console.log("Speculation Step 2. Try filter out puncuation and spaces.");

            speculated = input.replace(/\W/g,'');

            if ( speculated != 0 ) {
                // caret type still unknown, a bit trick here
                // according to https://github.com/normanzb/chuanr/issues/11
                console.log("Speculation Step 2.5. Comparing to get differ");
                differ = differUtil.diff(
                    this._untouched ? trim.call( this._untouched.result + '' ) : '', 
                    input
                );
                console.log("Differ", differ);

                input = trim.call( speculated );
            }

            // give up
            
        }
        else {

            console.log('Extracted, use extracted string.')
            input = trim.call( speculated );
            // can be extracted without problem mean the original string is formatted
            caret.type = 1;

        }

        console.log('Speculation Done, Result "' + input + '"');
        return input;
    }

    function onKeyDown( evt ) {

        if ( this._requireHandleKeyUp == true && this._keyCode == evt.keyCode) {
            // mean user keeps key down 
            // this is not allowed because it causes oninput never happen
            console.log('Continuous Key Down Prevented')
            util.preventDefault(evt);
            return;
        }

        if ( util.isAcceptableKeyCode( evt.keyCode ) == false || util.isModifier( evt ) ) {
            if ( util.isMovementKeyCode( evt.keyCode ) == false && util.isModifier( evt ) == false ) {
                console.log('Key Down Prevented')
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

        if ( this._isFormatted && this._el.value !== "" ) {
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
                'key': this._keyCode,
                'char': this._charCode,
                'del': util.isDelKey( this._keyCode ),
                'back': util.isBackSpaceKey( this._keyCode ),
                'caret': this._caret
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
        var me = this;
        var caret = {
            begin: 0,
            end: 0,
            // Caret type only in batch mode
            // 0 == unknown, 
            // 1 == formatted (pattern index), 
            // 2 == extracted (function index)
            type: 0
        };
        var caretMove = true;
        var format;
        var undid = false;
        // 0 == Batch Input
        // 1 == Single Input
        var inputType = input ? 1 : 0;
        

        if ( inputType ) {
            // == Single Input == 

            // 1. Initial Caret
            caret = input.caret;

            // 2. Initial Format
            this.formatter.input( input );
            format = this.formatter.output();

            // 3. Advance Caret?
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
            // == Batch Input ==
            input = this._el.value;

            // 1. Initial Caret
            // the caret at the point could be with format or without
            // will will handle it later
            caret = caretUtil.get( this._el );

            // 2. Initial Format
            // that means the change is done by pasting, dragging ...etc
            format = this.formatter.reset( input );

            // 2.5 Batch Input Tricks
            if ( format.result.matched ) {
                // match immediately means user inputs raw numbers
                caret.type = 2;
            }
            else {

                input = extraRawData.call( this, input, caret );
                format = this.formatter.reset( input );
                
                if ( 
                    format.result.matched == false && 
                    this.config.speculation.batchinput == true ) {
                    // get a matched format by trying different type of input
                    // also caret will be adjusted here
                    input = speculateBatchInput.call( this, input, format, caret );
                    format = this.formatter.reset( input );
                }
            }

            // 3. Advance Caret?
            caretMove = false;

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
            caret.type = 2;
        }

        if ( format == null ) {
            throw 'Boom, "format" is null, this should never happen.';
        }

        console.log( 'Final Format', format.result.toString() );

        // record the final format
        this._untouched = format;
        // update the element
        this._el.value = format.result;

        // update the caret accordingly
        console.log('Caret before format: ', caret );
        console.log('Move caret? ', caretMove);

        if ( inputType ) {
            caret.begin = this.formatter
                .index()
                    .of('pattern')
                    .by({ 'function': { index: caret.begin + ( caretMove ? 1 : 0 ) } });

            if ( caret.begin < 0 ) {
                caret.begin = this._el.value.length;
            }    
        }
        else {
            if ( caret.type === 2 ) {
                caret.begin = this.formatter
                    .index()
                        .of('pattern')
                        .by({ 'function': { index: caret.begin } });

            }
            else if ( caret.type === 1 ) {
                // do nothing?
            }
        }

        console.log('Caret after format: ', caret);

        // set cursor
        caretUtil.set( this._el, caret.begin );

        // this is to prevent some iOS shits to reset the caret after we set it
        // TODO: user setImmediate shim to make it faster?
        setTimeout(function(){
            if ( caretUtil.get( me._el) == caret.begin ) {
                return;
            }

            // oh shit, we failed
            caretUtil.set( me._el, caret.begin );
        });

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
        this._untouched = null;
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

    /**
     * Return true if user input at least fulfill one of the pattern
     */
    p.intact = function(){
        if ( this._untouched == null || this._untouched == "" ) {
            return false;
        }

        var result = this._untouched.pattern.apply( this._untouched.input , true );

        return result.matched;
    };

    // expose ioc setting
    Ctor.setting = ioc;

    return Ctor;
});