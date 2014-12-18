#Chuanr ![travis-build](https://api.travis-ci.org/normanzb/chuanr.png)


This component formats the `<input />` according the declared patterns

#Features

* Multiple patterns, best matching pattern will be selected for formatting and masking.
* Negative patterns, which prevents or filters out invalid user input. It also enable you to put all the validation and masking rule together in a consolidate place, much easier for maintenance.
* Negative regular expression pattern, use your most familiared regualr expression to filter out inputs.
* Intuitive pattern syntax and error messages.
* Allow anything to be part of the format, even digits, that means you can easily prefix the telephone number with area code.
* Flexible and customizable pattern function which allows you to match only the input you want.
* (Suppose to) supports all platforms, including IE6+ and mobile safari and mobile chrome.
* Handling all kinds of input, even text drag and drop.

#Usage

There are 3 ways to reference Chuanr:

##Use it as a global object

If you are not in a AMD loader environment, Chuanr will set itself as window.Chuanr, so you can access it by:

    new window.Chuanr();

##Use it as pre-packed AMD module

If you are in an AMD enabled environment, Chuanr will call the define() method so you can use it as a normal require js module, simply grab a piece of chuanr.js, put it anywhere in your project, and do:

    require('path/to/chuanr.min', function(Chuanr){ 
        new Chuanr();
        // ...
    } )

Using Chuanr as pre-packed AMD module makes sure Chuanr is self-contained and contamination-free, no pollution your AMD configuration. However to achieve that, Chuanr embedded a piece of [Almond](https://github.com/jrburke/almon) which increased the overall file size and you may not want it. So for some of you who build your own projects or want to get rid off Almond, you can clone this repo and do below: 

##Use it as unpacked AMD module

If you prefer to pack Chuanr as part of your project and reduce some bytes of overall file size, here is how:

    require('path/to/repo/src/Chuanr', function(Chuanr){ 
        new Chuanr();
        // ...
    } )

##Hook it up with `<INPUT />`

Once you gained the access to Chuanr constructor, by doing below you can instantiate it and hook it to the input element and start the magic:

    var elInput = document.getElementById('tester');
    var options = {

    };
    var chuanr = new Chuanr(options);
    chuanr.roast(elInput, [
        "({11}) {99ddd}-{dddd}",
        "({11}) {98ddd}-{dddd}",
        "({11}) {97d(01234569)dd}-{dddd}",
        "({11}) {96ddd}-{dddd}",
        "({11}) {95ddd}-{dddd}",
        "({dd}) {700d}-{dddd}",
        "({dd}) {7010}-{dddd}",
        "({dd}) {77dd}-{dddd}",
        "({dd}) {78dd}-{dddd}",
        "({dd}) {790d(124)}-{dddd}",
        "({dd}) {791d(23456789)}-{dddd}",
        "({dd}) {792d(03489)}-{dddd}",
        "({dd}) {793d(012456789)}-{dddd}",
        "({dd}) {794d}-{dddd}",
        "({11}) {d(2345)ddd}-{dddd}"
    ]);
    chuanr.on('prevented', function(){ alert('not allowed!') });

##Use regular expression to block user input

    var elInput = document.getElementById('tester');
    var chuanr = new Chuanr();
    
    chuanr.roast(elInput, ["~|[a-z]/i"]);

##Options

* speculation
    * batchinput - (Default to) true to enable automatical speculation on Batch Input, figure out what the user actually want to input by extracting real input from a formatted string or filtering out punctuations. For example, when this option is turned OFF (set to false), for pattern "({dd}) {ddd}", if the user pastes "(23) 456", Chuanr considers it as an incorrect input because it doesn't match the pattern (the pattern doesn't expect the parentheses and space). However if this option is turned ON, we consider it is a acceptable input because we will try to filter it or match with format.
* placeholder
    * empty - Specify the default placeholder for characters that haven't be inputted.
    * always - True to specify always showing the format and placeholders, even before user input.

##Properties

* intact() - Return true if the user input is fully matched with at least one pattern

##Methods

* roast( el, patterns ) - Link Chuanr with specified input element, format it against patterns
* dispose() - Call it when you don't want the formatting anymore

##Events

* prevented - Fire when user input something not accetpable.
* resumed - Fire no matter when user input is accepted.

###Custom Pattern Function

    Chuanr.setting.Pattern.functions['n']=function(){}

- where `n` must be one single char


#Understanding the Patterns


##Terms


* Pattern Type - Specify if the pattern matching positively or negatively.
* Positive Pattern - Inputs are accepted if they matches a positive pattern.
* Explicit Positive Pattern - Any pattern starts with "+|".
* Implicit Positive Pattern - Any positive pattern without the pattern type specification ("+|").
* Negative Pattern - Any pattern whose first 2 characters are "-|", inputs are not accepted if they fully matched a negative pattern.
* Passive Negative Pattern - A negative pattern which only works when .intact() is called (it doesn't prevent the user from inputting).
* Negative Regular Expressoin Pattern = Any pattern whose first 2 characters are "~|", and followed by regular expression in the format of `regexp/switches`.
* Pattern Matched -
    * When it is positive pattern: testing the input against the pattern from left to right, always consider it is MATCHED unless ANY "out of expectation" is encountered. 
    * When it is negative pattern: test the input against the pattern from left to right, always consider it is UNMATCHED, unless ALL characters are as expected.
    * Says a input which is 8576 can match a positive pattern of "+|{d}{d}{d}{d}{d}" but cannot match the pattern's negative counterpart "-|{d}{d}{d}{d}{d}".
* Validation Passed - Stop pattern iteration, set property isValid to true and allow further input.
* Validation Failed - Stop pattern iteration, set property isValid to false and do not allow the number be input.
* Pattern Function - Its a javascript function which takes 1 char as input and return true/false to indicate the matching result. You can specify the pattern function by wrapping the function name with "{" and "}" in the pattern.
* Shorthand - Any consecutive set of Pattern Functions can be written within same {}, for example, "{d}{d(5)}" can be written as "{dd(5)}".
* Batch Input - Means inputting several characters at once, for example, pasting, droping, undo...

##Pattern Function

Pattern function is useful for simplify the long pattern list by adding a bit flavor of regex:
(Some of below patterns are still WIP)

* d: match for any digit
* d(0123): match any digit within the parentheses.
* d(0-6): match any digit within the range which starts from 0 and ends with 6.
* d(=): match any digit that is same as previous one, if there is no previou digit, consider unmatched.
* d(?): match any digit or empty input (optional).
* d(+): match digit which equal to previous digit + 1, if previous digit is 9 then this pattern will never match, if there is no previou digit, consider unmatched.
* d(+n): match digit which is equal to previous digit + n. if previous digit + n > 9 then this pattern will never match, if there is no previou digit, consider unmatched.
* d(-): match digit which is equal to previous digit - 1, if previous digit is 0 then this pattern will never matchif there is no previou digit, consider unmatched.
* d(-1): same as above
* d(-n): the counterpart case of d(+n), you can figure it out.
* a: match alphabet
* a(abcd): match alphabet witin the parentheses
* x: shortcut to duplicate previous function
    * x(o) to make the match optional 
* ?: alias of x(o)
* n: never match, useful when you want to allow some input but not allow the specific input to be consider validate by when calling intact(). 
    * n(=) unmatch if equal to previous input
    * n(any char) unmatch if equal to specified input
* *: match everything, including empty and whitespace.
* *(regexp): match the regexp. 
* l: match the checksum from luhn algorithm validation, especially useful for creditcard validation.


#Build it


    npm install
    bower install
    grunt


#Test it

    npm test

##Special Thanks

[FirstOpinion's Formatter.js](https://github.com/firstopinion/formatter.js) - Stolen the pattern concept and the caret controling utility from there.