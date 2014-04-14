#Manual Test Cases

Open index.html and then

##on First Name field:

* type a3, and then type 3

##on Telephone Field:

* Paste "(22) 7010-5592"
* Paste "(22) 7010-5592", select all, Paste "(22) 7010-5592" again
* Paste "(22) 7010-559", and paste 2 between 5 and 9  
* Paste "(22) 7010-5592", select all, paste "(22) 7001-3332"
* type 227, it should format it to (22) 7, and then paste 7, check the caret position.
* type 227777777, it should format to "(22) 7777-7777", paste 7, check the caret position.
* Type 1, it should format it to (1 )     -     , paste 2 after 1
* Type 127, it formats to (12) 7, backspace twice  (mobile)
* Type 1270005566, it formats to (12) 7000-5566, backspace 5 times (mobile)
* Type 12700055, it formats to "(12) 7000-55  ", between the last 2 white space, paste 2
* Set pattern to '0{dddd}', type 1234, press backspace.
* Set pattern to '0{dddd}', '-|{dd(=)xx}', type 1234, press backspace.
* Set pattern to "{ddddddd?????}", "_|{3d(2349)dd(=)xxxx????}", type 344444444444, should be no exception and validation failed.