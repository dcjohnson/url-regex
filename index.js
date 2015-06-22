State = function (isTerm, transitions) {
    this.isTerm = isTerm;
    this.transitions = [];
    if(typeof transitions !== 'undefined') {
        this.transitions = this.transitions.concat(transitions);
    }
    if(typeof isTerm === 'undefined') {
        this.isTerm = false;
    }
};

State.prototype.transition = function (transVal) {
    for(var index = 0; index < this.transCount(); index++) {
        if(transVal === this.transitions[index].transVal) {
            return this.transitions[index].state;
        }
    }
    return null;
};

State.prototype.addTransition = function(transVal, state) {
    if(!this.hasTransition(transVal)) {
        this.transitions.push({
            state : state,
            transVal : transVal
        });
    }
};

State.prototype.addTransitions = function(transVals, state) {
    var base = this;
    transVals.forEach(function(elem, index, array) {
        base.addTransition(elem, state);
    });
};

State.prototype.hasTransition = function(transVal) {
    for(var index = 0; index < this.transitions.length; index++) {
        if(this.transitions[index].transVal === transVal) {
            return true;
        }
    }

    return false;
}

State.prototype.transCount = function() {
    return this.transitions.length;
};

Ndfa = function (regex) {
    this.startState = null;
    this.regex = regex;
};

Ndfa.prototype.generateStates = function() {
    this.startState = new State();

    var curState = this.startState;

    for (var index = 0; index < this.regex.length; index++) {
        if(this.validate.isValid(this.regex[index])) {
            var newState = new State();
            curState.addTransition(this.regex[index], newState);
            curState = newState;
        } else if(this.regex[index] === '(') {
            var enumLen = this.getEnumLength(this.regex.substring(index));
            var enumeration = this.extract(this.regex, index, enumLen);
            var newState = this.getEnumState(enumeration, curState);
            if(newState !== null) {
                curState = newState;
                index += enumLen;
            }
        } else if(this.regex[index] === '[') {
            var loopLen = this.getLoopLength(this.regex.substring(index));
            var loop = this.extract(this.regex, index, loopLen);
            var newState = this.processLoop(loop, curState);
            if(newState !== null) {
                curState = newState;
                index += loopLen;
            }
        }
    }
    curState.isTerm = true;
};

Ndfa.prototype.extract = function(str, index, extractionLen) {
    return this.regex.substr(index + 1, extractionLen - 1);
}

Ndfa.prototype.getLoopLength = function(str) {
    if(str[0] !== '[') {
        return null;
    }

    var index = 0;
    while(str[index] !== ']') {
        if(str.length === index) {
            return null;
        }
        index += 1;
    }
    return index;
};

Ndfa.prototype.processLoop = function(loop, initialState) {
    var trans = loop.split('|');

    for(var index = 0; index < trans.length; index++) {
        var notValid = (trans[index].length !== 1 || trans[index].length !== 2) && !this.validate.isValid(trans[index])
        if(notValid) {
            return null;
        }
    }

    var state = new State();
    var base = this;

    trans.forEach(function(elem, index, array) {
        if(elem.length === 1) {
            initialState.addTransition(elem, state);
            state.addTransition(elem, state);
        } else {
            var range = base.validate.getRange(elem.charAt(0), elem.charAt(1));
            initialState.addTransitions(range, state)
            state.addTransitions(range, state);
        }
    });

    return state
};

Ndfa.prototype.getEnumLength = function(str) {
    if(str[0] !== '(') {
        return null;
    }

    var index = 0;
    while(str[index] !== ')') {
        if(str.length === index) {
            return null;
        }
        index += 1;
    }

    return index;
};

Ndfa.prototype.getEnumState = function(str, initialState) {
    var trans = str.split('|');
    for(var index = 0; index < trans.length; index++) {
        var notValid = trans[index].length !== 1 || !this.validate.isValid(trans[index])
        if(notValid) {
            return null;
        }
    }

    var state = new State();

    trans.forEach(function(element, index, array) {
        initialState.addTransition(element, state);
    });

    return state;
};

Ndfa.prototype.resolveAmbiguity = function(lastState, firstState) { // Prevent the creation of an NDFA!

};

Ndfa.prototype.testString = function(str) {
    var curState = this.startState;
    for(var index = 0; index < str.length; index++) {
        curState = curState.transition(str[index]);
        if(curState === null) {
            break;
        }
    }
    return curState !== null && curState.isTerm;
};

Ndfa.prototype.validate = (function() {
    this.validateRangeable = [
        function(char) {
            var charCast = char.charCodeAt(0);
            var diff = '9'.charCodeAt(0) - charCast;
            return 9 >= diff && diff >= 0;
        },
        function(char) {
            var charCast = char.charCodeAt(0);
            var diff = 'z'.charCodeAt(0) - charCast;
            return 25 >= diff && diff >= 0;
        },
        function(char) {
            var charCast = char.charCodeAt(0);
            var diff = 'Z'.charCodeAt(0) - charCast;
            return 25 >= diff && diff >= 0;
        }
    ];

    this.validateUnRangeable = [
        function(char) {
            return char === '-' || char === '_' ||
                char === '.' || char === '~' ||
                char === '%';
        }
    ];
    return {
        isValid: function(str) {
            var validationFuncs = validateRangeable.concat(validateUnRangeable);
            var valid = false;
            for(var index = 0; index < validationFuncs.length; index++) {
                for(var charIndex = 0; charIndex < str.length; charIndex++) {
                    valid = valid || validationFuncs[index](str.charAt(charIndex));
                }
            }
            return valid;
        },
        getRange: function(bound1, bound2) {
            var valid = false;
            for(var index = 0; index < validateRangeable.length; index++) {
                valid = valid || (validateRangeable[index](bound1) && validateRangeable[index](bound2));
            }
            if(!valid) {
                return null;
            }
            var bound1Int = bound1.charCodeAt(0);
            var bound2Int = bound2.charCodeAt(0);
            var charRange = [];
            if(bound1Int > bound2Int) {
                var begin = bound2Int;
                var end = bound1Int;
            } else {
                var begin = bound1Int;
                var end = bound2Int;
            }

            for(var char = begin; char <= end; char++) {
                charRange.push(String.fromCharCode(char));
            }

            return charRange;
        }
    };
})();

exports.Ndfa = Ndfa;

var x = new Ndfa('_-(a|b|e|c)[-|ac](q|z|e)');
x.generateStates();
console.log(x.testString('_-~ce'));
console.log(x.testString('_-ccz'))
console.log(x.testString('_-cdb'))
console.log(x.testString('_-bcb'));
console.log(x.testString('_-ccacacacacacaccacaca-----a-ca-c-a-c-ac-q'));
