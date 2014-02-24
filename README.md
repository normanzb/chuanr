#Chuanr


This component formats the `<input />` according the declared patterns


#Feature


* Multiple Patterns
* Intuitive pattern syntax and error messages
* Positive and negative pattern
* Flexible pattern function to match specific characters
* Customizable pattern function


#Terms


* Pattern Type - Specify if the pattern matching positively or negatively.
* Positive Pattern - Any pattern except patterns whose first 2 characters are "-|".
* Explicit Positive Pattern - Any pattern starts with "+|".
* Implicit Positive Pattern - Any positive pattern without the pattern type specification ("+|").
* Negative Pattern - Any pattern whose first 2 characters are "-|".
* Pattern Matched -
    * When it is positive pattern: testing the input against the pattern from left to right, always consider it is MATCHED unless ANY "out of expectation" is encountered. 
    * When it is negative pattern: test the input against the pattern from left to right, always consider it is UNMATCHED, unless ALL characters are as expected.
    * Says a input which is 8576 can match a positive pattern of "+|{d}{d}{d}{d}{d}" but cannot match the pattern's negative counterpart "-|{d}{d}{d}{d}{d}".
* Validation Passed - Stop pattern iteration, set property isValid to true and allow further input.
* Validation Failed - Stop pattern iteration, set property isValid to false and do not allow the number be input.
* Pattern Function - The text which wrapped by "{" and "}".
* Shorthand - Any consecutive set of Pattern Functions can be written within same {}, for example, "{d}{d(5)}" can be written as "{dd(5)}".



#Custom Pattern Function


    Chuanr.setting.Pattern.functions['n']=function(){}
    
    
- where `n` must be one single char