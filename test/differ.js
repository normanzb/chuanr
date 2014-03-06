var should = require('chai').should(),
    assert = require('chai').assert,
    requirejs = require('requirejs');


;!function (require, nodeRequire) {

require.config({
    nodeRequire: nodeRequire
});

var differ = require('../src/differ.js');

describe('differ', function(){

    /* Pattern Function */

    var ERROR_RUNTIME = 'Runtime error: ';

    it('returns the insertion and deletion of the original copy and the indexes', function(){
        var result = differ.diff('abc8437xyz', 'abc2345661xyz');

        assert.deepEqual(result, {
            deletion: {
                text: "8437",
                caret: {
                    begin: 3,
                    end: 7
                }
            },
            insertion: {
                text: "2345661",
                caret: {
                    begin: 3,
                    end: 10
                }
            }
        });
    });

    it('returns correct info when the insertion happen to be the same as previous char', function(){
        var result = differ.diff('(22) 7   -    ', '(22) 77   -    ');

        assert.deepEqual(result, {
            deletion: {
                text: "",
                caret: {
                    begin: 6,
                    end: 6
                }
            },
            insertion: {
                text: "7",
                caret: {
                    begin: 6,
                    end: 7
                }
            }
        });
    });

    it('returns correct info when the deletion happen to be the same as previous char', function(){
        var result = differ.diff('(22) 77   -    ', '(22) 7   -    ');

        assert.deepEqual(result, {
            deletion: {
                text: "7",
                caret: {
                    begin: 6,
                    end: 7
                }
            },
            insertion: {
                text: "",
                caret: {
                    begin: 6,
                    end: 6
                }
            }
        });
    });

    it('returns the deletion of the original copy and the indexes', function(){
        var result = differ.diff('abc8437xyz', 'abcxyz');

        assert.deepEqual(result, {
            deletion: {
                text: "8437",
                caret: {
                    begin: 3,
                    end: 7
                }
            },
            insertion: {
                text: "",
                caret: {
                    begin: 3,
                    end: 3
                }
            }
        });
    });

    it('returns the info when deletion happen from the beginning', function(){
        var result = differ.diff('abc8437xyz', 'xyz');

        assert.deepEqual(result, {
            deletion: {
                text: "abc8437",
                caret: {
                    begin: 0,
                    end: 7
                }
            },
            insertion: {
                text: "",
                caret: {
                    begin: 0,
                    end: 0
                }
            }
        });
    });

    it('returns the info when deletion happen from the ending', function(){
        var result = differ.diff('abc8437xyz', 'abc8437');

        assert.deepEqual(result, {
            deletion: {
                text: "xyz",
                caret: {
                    begin: 7,
                    end: 10
                }
            },
            insertion: {
                text: "",
                caret: {
                    begin: 7,
                    end: 7
                }
            }
            
        });
    });

    it('returns the info when nothing changed', function(){
        var result = differ.diff('abc8437xyz', 'abc8437xyz');

        assert.deepEqual(result, {
            deletion: {
                text: "",
                caret: {
                    begin: -1,
                    end: -1
                }
            },
            insertion: {
                text: "",
                caret: {
                    begin: -1,
                    end: -1
                }
            }
        });
    });

    it('returns the info when everything changed', function(){
        var result = differ.diff('abc8437xyz', '38djknf664');

        assert.deepEqual(result, {
            deletion: {
                text: "abc8437xyz",
                caret: {
                    begin: 0,
                    end: 10
                }
            },
            insertion: {
                text: "38djknf664",
                caret: {
                    begin: 0,
                    end: 10
                }
            }
        });
    });

});

}(requirejs, require);