
//>>excludeStart("release", pragmas.release);
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}
//>>excludeEnd("release");

define([
    './Formatter', 
    './Pattern', 
    './PatternConstant', 
    './util', 
    './caret', 
    './differ', 
    '../lib/boe/src/boe/Function/bind', 
    '../lib/boe/src/boe/String/trim', 
    '../lib/boe/src/boe/Object/clone', 
    '../lib/boe/src/boe/util', 
    '../lib/cogs/src/cogs/emittable',
    '../lib/cogs/src/cogs/event',
    './shim/oninput'
    //>>excludeStart("release", pragmas.release);
    ,'./shim/console'
    //>>excludeEnd("release");
    ], 
    function ( 
        Formatter, 
        Pattern, 
        PatternConstant,
        util, caretUtil, differUtil,
        bind, trim, clone, boeUtil, 
        emittable, event, 
        InputObserver
        //>>excludeStart("release", pragmas.release);
        , console
        //>>excludeEnd("release");
     ) {

    // ioc settings
    var ioc = {
        Formatter: Formatter,
        Pattern: Pattern,
        InputObserver: InputObserver
    };

    var defaultSettings = {
        placeholder: {
            empty: ' '
        },
        speculation: {
            batchinput: true
        }
    };

    /* Private Methods */
    function tryExtractAndResetCaret( value, caret ) {
        // do a filtering before actual inputting
        var original, extraction;

        try{
            //>>excludeStart("release", pragmas.release);
            console.log( "Do Extraction of '" + value + "'");
            //>>excludeEnd("release");
            extraction = this.formatter.extract( value );
            if ( extraction != null ) {
                original = trim.call( extraction + '' );
                //>>excludeStart("release", pragmas.release);
                console.log( "Exracted", original );
                //>>excludeEnd("release");
            }
        }
        catch(ex){
            original = null;
        }

        if ( original == null ) {
            //>>excludeStart("release", pragmas.release);
            console.log( "Extraction failed " );
            //>>excludeEnd("release");
        }

        if ( caret && original != null ){
            //>>excludeStart("release", pragmas.release);
            console.log( 'Caret before update: ', caret );
            //>>excludeEnd("release");

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

            //>>excludeStart("release", pragmas.release);
            console.log( 'Original input extracted: "' + original + '"' , 'Updated caret: ', caret );
            //>>excludeEnd("release");
        }

        if ( original == 0 ) {
            this._isFormatted = false;
        }

        return original;
    }

    function extraRawData( input, caret ){
        var prev, ret, prevInput, begin, end, isConstantDeletion = false,
            prefix, postfix;

        //>>excludeStart("release", pragmas.release);
        console.log('Not raw data, need some sophisicated logic to figure out');
        //>>excludeEnd("release");

        prev = this._untouched ? this._untouched.result + '' : '';

        differ = differUtil.diff(
            prev, 
            input
        );

        //>>excludeStart("release", pragmas.release);
        console.log("Differ '" + prev + "':'" + input + "'", differ);
        //>>excludeEnd("release");

        extraction = this.formatter.extract( prev );

        if ( extraction == null ) {
            return ret;
        }

        prevInput = extraction + '';

        isSpaceDeletion = differ.insertion.caret.begin == differ.insertion.caret.end &&
            (
                caret.begin < extraction.pattern.items.length &&
                extraction.pattern.items[caret.begin].type == PatternConstant.MODE_FUNCTION && 
                differ.deletion.text == this.config.placeholder.empty
            );

        isConstantDeletion = differ.insertion.caret.begin == differ.insertion.caret.end &&
            differ.deletion.text.length > 0 && 
            extraction.pattern.items[caret.begin].type == PatternConstant.MODE_CONSTANT;

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
            //>>excludeStart("release", pragmas.release);
            console.log("User deleted " + differ.deletion.text.length + "space/constant(s)");
            //>>excludeEnd("release");
            begin = extraction.pattern
                .index().of('function').by({ pattern: { index: caret.begin }}) - (isConstantDeletion?1:0);
        }

        if ( begin > prevInput.length - 1 ) {
            begin = prevInput.length;
            end = begin;
        }

        prefix = prevInput.substring( 0, begin );
        postfix = prevInput.substring( end, prevInput.length + 1);

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

        //>>excludeStart("release", pragmas.release);
        console.log( 'Raw Input' , input, caret );
        //>>excludeEnd("release");
        ret = input;

        return ret;
    }

    function speculateBatchInput( input, format, caret ){

        var speculated, finalExtraction;

        //>>excludeStart("release", pragmas.release);
        console.log("Try to be smart, figure out what the user actually want to input");
        console.log("Speculation Step 1. Try Extract");
        //>>excludeEnd("release");
        speculated = tryExtractAndResetCaret.call( this, this._el.value, null );

        if ( speculated == null ) {

            //>>excludeStart("release", pragmas.release);
            console.log('Failed to extract.');
            console.log("Speculation Step 2. Try filter out puncuation and spaces.");
            //>>excludeEnd("release");
            speculated = input.replace(/\W/g,'');

            if ( speculated != 0 ) {
                // caret type still unknown, a bit trick here
                // according to https://github.com/normanzb/chuanr/issues/11
                //>>excludeStart("release", pragmas.release);
                console.log("Speculation Step 2.5. Comparing to get differ");
                //>>excludeEnd("release");
                differ = differUtil.diff(
                    this._untouched ? trim.call( this._untouched.result + '' ) : '', 
                    input
                );
                //>>excludeStart("release", pragmas.release);
                console.log("Differ", differ);
                //>>excludeEnd("release");

                input = trim.call( speculated );
            }

            // give up
            
        }
        else {
            //>>excludeStart("release", pragmas.release);
            console.log('Extracted, use extracted string.');
            //>>excludeEnd("release");
            input = trim.call( speculated );
            // can be extracted without problem mean the original string is formatted
            caret.type = 1;

        }
        //>>excludeStart("release", pragmas.release);
        console.log('Speculation Done, Result "' + input + '"');
        //>>excludeEnd("release");
        return input;
    }

    function onKeyDown( evt ) {

        if ( this._requireHandleKeyUp == true && this._keyCode == evt.keyCode) {
            // mean user keeps key down 
            // this is not allowed because it causes oninput never happen
            //>>excludeStart("release", pragmas.release);
            console.log('Continuous Key Down Prevented')
            //>>excludeEnd("release");
            util.preventDefault(evt);
            return;
        }

        if ( util.isAcceptableKeyCode( evt.keyCode ) == false || util.isModifier( evt ) ) {
            if ( util.isMovementKeyCode( evt.keyCode ) == false && util.isModifier( evt ) == false ) {
                //>>excludeStart("release", pragmas.release);
                console.log('Key Down Prevented');
                //>>excludeEnd("release");
                util.preventDefault(evt);
            }
            
            return;
        }

    }

    function onInput( ) {
        //>>excludeStart("release", pragmas.release);
        console.hr();
        //>>excludeEnd("release");

        render.call(this);
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
        var format;
        var undid = false;    

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
        if ( format.result.legitimate ) {
            if ( 
                this._isFormatted == false && 
                (
                    this._el.value != false ||
                    this._el.value === "0"
                ) &&
                caret.begin == 0
            ) {
                // you must on ios 5, which sucks
                caret.begin = trim.call( this._el.value.length );
                caret.end = caret.begin;
            }
            // match immediately means user inputs raw numbers
            caret.type = 2;
        }
        else {

            input = extraRawData.call( this, input, caret );
            format = this.formatter.reset( input );
            
            if ( 
                format.result.legitimate == false && 
                this.config.speculation.batchinput == true ) {
                // get a matched format by trying different type of input
                // also caret will be adjusted here
                input = speculateBatchInput.call( this, input, format, caret );
                format = this.formatter.reset( input );
            }
        }

        // revert if match failed
        while ( format.result.legitimate == false ) {
            if ( undid == false ) {
                undid = format;
            }
            format = this.formatter.undo()
            //>>excludeStart("release", pragmas.release);
            console.log('Failed to format, undo.');
            //>>excludeEnd("release");

            if ( format == null ) {
                //>>excludeStart("release", pragmas.release);
                console.log('Tried to undo, but failed.');
                //>>excludeEnd("release");
                break;
            }

            caret.begin = tryExtractAndResetCaret.call( this, format.result.toString(), null ).length;
            caret.end = caret.begin;
            caret.type = 2;
        }

        if ( format == null ) {
            throw 'Boom, "format" is null, this should never happen.';
        }

        //>>excludeStart("release", pragmas.release);
        console.log( 'Final Format', format.result.toString() );
        //>>excludeEnd("release");

        // record the final format
        this._untouched = format;
        // update the element
        this._el.value = format.result;

        // update the caret accordingly
        //>>excludeStart("release", pragmas.release);
        console.log('Caret before format: ', caret );
        //>>excludeEnd("release");

        if ( caret.type === 2 ) {
            caret.begin = this.formatter
                .index()
                    .of('pattern')
                    .by({ 'function': { index: caret.begin } });

        }
        else if ( caret.type === 1 ) {
            // do nothing?
        }
        //>>excludeStart("release", pragmas.release);
        console.log('Caret after format: ', caret);
        //>>excludeEnd("release");

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
        this._untouched = null;
        this._isFormatted = false;

        this._onKeyDown = bind.call(onKeyDown, this);

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
            this.patterns.push( ioc.Pattern.parse( patterns[ i ], this.config ) );
        }

        this.formatter = new ioc.Formatter(this.patterns);
        
        this.oninput = new InputObserver();
        this.oninput.observe(el);
        this.oninput.oninput = bind.call(onInput, this);

        util.addListener(el, 'keydown', this._onKeyDown );

        if ( this._el.value != "" ) {
            // not equal to empty spaces
            onInput.call(this);
        }

    };

    p.dispose = function() {
        this.oninput.dispose();
        util.removeListener( this._el, 'keydown', this._onKeyDown );
    };

    /**
     * Return true if user input at least fulfill one of the pattern
     */
    p.intact = function(){
        if ( this._untouched == null || this._untouched == "" ) {
            return false;
        }

        var result = this._untouched.pattern.apply( this._untouched.input , true );

        return result.legitimate;
    };

    // expose ioc setting
    Ctor.setting = ioc;

    return Ctor;
});