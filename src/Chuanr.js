
//>>excludeStart("release", pragmas.release);
if (typeof define !== 'function' && typeof module != 'undefined') {
    var define = require('amdefine')(module);
}
//>>excludeEnd("release");

define([
'./Formatter', 
'./Pattern', 
'./PatternConstant', 
'./PatternApplicationResult',
'./util', 
'./caret', 
'./differ', 
'./speculate',
'../lib/boe/src/boe/Function/bind', 
'../lib/boe/src/boe/String/trim', 
'../lib/boe/src/boe/Object/clone', 
'../lib/boe/src/boe/util', 
'../lib/cogs/src/cogs/emittable',
'../lib/cogs/src/cogs/event',
'../lib/xinput/XInput'
//>>excludeStart("release", pragmas.release);
, './shim/console'
//>>excludeEnd("release");
], 
function ( 
    Formatter, 
    Pattern, 
    PatternConstant,
    PatternApplicationResult,
    util, caretUtil, differUtil, speculateBatchInput,
    bind, trim, clone, boeUtil, 
    emittable, event, 
    InputObserver
    //>>excludeStart("release", pragmas.release);
    , console
    //>>excludeEnd("release");
 ) {
    'use strict';

    var promiseOfRefocus;

    // ioc settings
    var ioc = {
        Formatter: Formatter,
        Pattern: Pattern,
        InputObserver: InputObserver
    };

    var defaultSettings = {
        placeholder: {
            empty: ' ',
            always: false
        },
        speculation: {
            batchinput: true
        }
    };

    var lockFocus = false;

    /* Private Methods */
    function tryExtractAndResetCaret( value, caret ) {
        // do a filtering before actual inputting
        var original, extraction;

        try{
            //>>excludeStart("release", pragmas.release);
            console.log( 'Do Extraction of \'' + value + '\'');
            //>>excludeEnd("release");
            extraction = this.formatter.extract( value );
            if ( extraction != null ) {
                original = trim.call( extraction + '' );
                //>>excludeStart("release", pragmas.release);
                console.log( 'Exracted', original );
                //>>excludeEnd("release");
            }
        }
        catch(ex){
            original = null;
        }

        if ( original == null ) {
            //>>excludeStart("release", pragmas.release);
            console.log( 'Extraction failed ' );
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
            prefix, postfix, tmp, differ, extraction, isSpaceDeletion;

        //>>excludeStart("release", pragmas.release);
        console.log('Not raw data, need some sophisicated logic to figure out');
        //>>excludeEnd("release");

        prev = this._untouched ? this._untouched.result + '' : '';

        differ = differUtil.diff(
            prev, 
            input
        );

        //>>excludeStart("release", pragmas.release);
        console.log('Differ \'' + prev + '\':\'' + input + '\'', differ);
        //>>excludeEnd("release");

        extraction = this.formatter.extract( prev );

        if ( extraction == null ) {
            ret = this.formatter.extract( input );
            return ret;
        }

        prevInput = extraction + '';

        if (extraction.pattern.items[caret.begin] == null && extraction.pattern.items[0] != null) {
            //>>excludeStart("release", pragmas.release);
            console.log('Caret position seems incorrect or out of sync due to the ios hack... ' +
                'violently setting it to 0');
            //>>excludeEnd("release");
            caret.begin = 0;
        }

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
                .by({ pattern: { index: differ.deletion.caret.end }});

        if ( isSpaceDeletion || isConstantDeletion ) {
            // quite possibly user deleted constant
            //>>excludeStart("release", pragmas.release);
            console.log('User deleted ' + differ.deletion.text.length + 'space/constant(s)');
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
                tmp = end + differ.insertion.text.length - differ.deletion.text.length;
                if ( tmp >= 0 ) {
                    caret.begin = tmp;
                    caret.end = tmp;
                    caret.type = 2;
                }
            }
        }

        //>>excludeStart("release", pragmas.release);
        console.log( 'Raw Input' , input, caret );
        //>>excludeEnd("release");
        ret = input;

        return ret;
    }

    function onKeyDown( evt ) {

        if ( this._requireHandleKeyUp == true && this._keyCode == evt.keyCode) {
            // mean user keeps key down 
            // this is not allowed because it causes oninput never happen
            //>>excludeStart("release", pragmas.release);
            console.log('Continuous Key Down Prevented');
            //>>excludeEnd("release");
            util.preventDefault(evt);
            return;
        }

    }

    function onInput( caretMode ) {
        //>>excludeStart("release", pragmas.release);
        console.hr();
        //>>excludeEnd("release");

        if ( caretMode == null ) {
            caretMode = 1;
        }

        //>>excludeStart("release", pragmas.release);
        console.log('caretMode: ' + caretMode);
        //>>excludeEnd("release");

        tryRender.call( this, caretMode );
    }

    function updateInput( result ){
        var me = this;
        var isEmpty = true;
        result = result + '';

        for(var l = result.length; l--; ) {
            if ( result.charAt(l) != this.config.placeholder.empty ) {
                isEmpty = false;
                break;
            }
        }

        if ( !isEmpty ) {
            if ( this._el.value != result ) {
                this._el.value = result;    
            }
            else {
                return true;
            }
        }
        else {
            this._el.value = '';
        }

        me.oninput.sync();
    }

    function tryRender(){
        var me = this;
        var ret;

        me.oninput.neglect();
        ret = render.apply(me, arguments);
        me.oninput.observe(me._el);

        return ret;
    }

    function createFakeFormat(input){
        var me = this;
        me._untouched = new PatternApplicationResult({
            result: input
        });
    }

    /*
     * @caretMode - 0: skip setting caret
     *              1: automatically setting according to changes on the result
     *              2: compulsory to set it
     */
    function render( caretMode ) {
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
        var extracted;
        var input;

        // == Batch Input ==
        input = me._el.value;

        // 1. Initial Caret
        // the caret at the point could be with format or without
        // we will handle it later
        if ( lockFocus ) {
            caret = lockFocus;
        }
        else {
            caret = caretUtil.get( me._el );
        }
        caret.type = 1;

        // 2. Extract The Raw Input
        // Try to extract the raw data based on the format
        // that means the change is done by pasting, dragging ...etc
        extracted = extraRawData.call( me, input, caret );
        format = me.formatter.reset( extracted );

        if ( format && format.result.legitimate ) {
            input = extracted;
        }
        else if ( input != extracted ) {

            format = me.formatter.reset( input );

            if ( format && format.result.legitimate ) {
                if ( 
                    me._isFormatted == false && 
                    (
                        me._el.value != false ||
                        me._el.value === '0'
                    ) &&
                    caret.begin == 0
                ) {
                    // you must on ios 5, which sucks
                    caret.begin = trim.call( me._el.value ).length ;
                    caret.end = caret.begin;
                }
                // match immediately means user inputs raw numbers
                caret.type = 2;
            }
        }

        if ( 
            format && format.result.legitimate == false &&
            me.config.speculation.batchinput == true 
        ) {
            // get a matched format by trying different type of input
            // also caret will be adjusted here
            input = speculateBatchInput( me, input, format, caret, tryExtractAndResetCaret );
            format = me.formatter.reset( input );
        }

        if ( format == null ) {
            // that probably means there is neither no pattern for formatting
            // ( user did not define a formatting (positive) pattern )
            // or no negative pattern matched
            createFakeFormat.call(me, input);

            //>>excludeStart("release", pragmas.release);
            console.log('Exiting with previous format set to ', me._untouched);
            //>>excludeEnd("release");
            return;
        }

        // revert if match failed
        while ( format.result.legitimate == false ) {
            if ( undid == false ) {
                undid = format;
            }
            
            //>>excludeStart("release", pragmas.release);
            console.log('Failed to format, undoing...');
            //>>excludeEnd("release");

            format = me.formatter.undo();

            if ( format == null ) {
                //>>excludeStart("release", pragmas.release);
                console.log('Tried to undo, but failed, so we revert to the value before change: ' + (me._untouched || '') );
                //>>excludeEnd("release");
                updateInput.call( me, me._untouched && me._untouched.result || '' );
                break;
            }

            //>>excludeStart("release", pragmas.release);
            console.log('undone, now format is', format + '');
            //>>excludeEnd("release");

            caret.begin = tryExtractAndResetCaret.call( me, format.result.toString(), null ).length;
            caret.end = caret.begin;
            caret.type = 2;
        }

        // same reason as the same check before, but this time it must at least matched negative 
        // pattern once
        if ( format == null ) {
            createFakeFormat.call(me, me._untouched && me._untouched.result || '');

            //>>excludeStart("release", pragmas.release);
            console.log('Exiting with previous format set to ', me._untouched);
            //>>excludeEnd("release");
            return;
        }

        //>>excludeStart("release", pragmas.release);
        console.log( 'Final Format', format.result.toString() );
        //>>excludeEnd("release");

        // record the final format
        me._untouched = format;
        // update the element
        var skipCaret = updateInput.call( me, format.result );

        if ( 
            ( caretMode == 1 && lockFocus != null && skipCaret !== true ) || 
            caretMode == 2 
        ) {
            // update the caret accordingly
            //>>excludeStart("release", pragmas.release);
            console.log('Caret before format: ', caret );
            //>>excludeEnd("release");

            if ( caret.type === 2 ) {
                caret.begin = me.formatter
                    .index()
                        .of('pattern')
                        .by({ 'function': { index: caret.begin } });

            }
            else if ( caret.type === 1 ) {
                // set it to first slot that need to be inputted
                caret.begin = me.formatter
                    .index()
                        .of('pattern')
                        .by({ 'function': { index: format.input.length } });
            }
            //>>excludeStart("release", pragmas.release);
            console.log('Caret after format: ', caret);
            //>>excludeEnd("release");

            lockFocus = caret;

            // set cursor
            caretUtil.set( me._el, caret.begin );

            // this is to prevent some iOS shits ( <= 6.0 ) to reset the caret after we set it
            // Caveat: check caretUtil.get( me._el ).begin != caret.begin doesnot work here
            // ios always return the correct caret at this time, it will update the caret to 
            // an incorrect one later... mobile safari sucks
            // TODO: use setImmediate shim to make it faster?
            refocus.call(me, caret);
        }

        if ( format.result != 0 ) {
            me._isFormatted = true;
        }
        else {
            me._isFormatted = false;
        }

        // fire event
        if ( undid ) {
            me.onPrevented.invoke( undid );
        }
        else {
            me.onResumed.invoke( format );
        }

    }

    function refocus(caret){
        var me = this;
        if (promiseOfRefocus) {
            promiseOfRefocus.then(refocus);
            return;
        }
        promiseOfRefocus = new Promise(function(rs){
            setTimeout(function(){
                if ( caretUtil.get( me._el) != caret.begin ) {
                    // oh shit, we failed
                    caretUtil.set( me._el, caret.begin );
                }

                lockFocus = false;
                promiseOfRefocus = null;
                rs();
            });
        });
    }

    /* Public Methods */
    function Ctor( config ) {
        var me = this;
        me.patterns = [];
        me.passives = [];
        me.formatter = null;
        me.oninput = null;
        me.config = clone.call(defaultSettings, true);
        boeUtil.mixin( me.config, config, function( key, sourceValue ) {
            return boeUtil.mixin( me.config[key] || {}, sourceValue );
        } );

        me._el = null;
        me._untouched = null;
        me._isFormatted = false;

        me._onKeyDown = bind.call( onKeyDown, me );
        me._onFocus = bind.call( onInput, me, 2 );

        me.onPrevented = event();
        me.onResumed = event();
        emittable( me );

    }

    var p = Ctor.prototype;

    /**
     * Bind Chuanr with specific input elment
     */
    p.roast = function (el, patterns) {
        var current;

        if ( el == null || el.tagName.toUpperCase() != 'INPUT' ) {
            throw 'Target input element must be specified.';
        }

        this._el = el;

        for( var i = 0 ; i < patterns.length; i++ ) {
            current = patterns[i];
            // filter out empty string
            if ( current == null || current == false ) {
                continue;    
            }
            this.patterns.push( ioc.Pattern.parse( current, this.config ) );
        }

        this.formatter = new ioc.Formatter(this.patterns);
        
        this.oninput = new InputObserver();
        this.oninput.observe(el);
        this.oninput.oninput = bind.call( onInput, this, 1 );

        util.addListener(el, 'keydown', this._onKeyDown );
        util.addListener(el, 'focus', this._onFocus );

        if ( this._el.value !== '' || this.config.placeholder.always === true ) {
            // not equal to empty spaces
            onInput.call( this, document.activeElement === el ? 1 : 0 );
        }

    };

    p.dispose = function() {
        this.oninput.dispose();
        util.removeListener( this._el, 'keydown', this._onKeyDown );
        util.removeListener( this._el, 'focus', this._onFocus );
    };

    /**
     * Return true if user input at least fulfill one of the pattern
     */
    p.intact = function(){
        // use this._el.value as backup because otherwise when there is no positive pattern present,
        // untouch will always be null
        return this.formatter.isIntact( this._untouched && this._untouched.input || this._el.value );
    };

    // expose ioc setting
    Ctor.setting = ioc;

    return Ctor;
});