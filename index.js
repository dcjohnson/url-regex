// This node library follows some rules that I think are very reasonable.  Basically it doesn't work on a url that is stupidly complex.
// There is no need for a url to contain nested loops or enumerations.  The restrictions also mean that loops are the only place where ambiguity, and thus, an NDFA could occur.
// This library takes this into account and will resolve it for you.
// I also need to rewrite this so that it follows better design with JavaScript.
// This is the first reasonable complex JavaScript program I have written.  The only real issue is how I handle errors.

State = function(isTerm, transitions) {
    this.isTerm = isTerm;
    this.transitions = transitions;
    if (typeof transitions === 'undefined') {
        this.transitions = [];
    }
    if (typeof isTerm === 'undefined') {
        this.isTerm = false;
    }
}

State.prototype.transition = function(transVal) {
    for (var index = 0; index < this.transCount(); index++) {
        if (transVal === this.transitions[index].transVal) {
            return this.transitions[index].state;
        }
    }
    return null;
}

State.prototype.addTransition = function(transVal, state) {
    var hasTrans = this.getTransition(transVal);
    if (hasTrans === null) {
        this.transitions.push({
            state: state,
            transVal: transVal
        });
    } else if (this === hasTrans.state) {
        this.updateTransition(transVal, transVal, state);
        var selfTransitions = this.getSelfTransitions();
        selfTransitions.forEach(function(value) {
            state.addTransition(value.transVal, value.state);
        });
        state.addTransition(transVal, state);
    }
}

State.prototype.getSelfTransitions = function() {
    var base = this;
    return this.transitions.filter(function(value) {
        return value.state === base;
    });
}

State.prototype.updateTransition = function(transVal, newTransVal, newState) {
    for (var index = 0; index < this.transitions.length; index++) {
        if (this.transitions[index].transVal === transVal) {
            this.transitions[index] = {
                state: newState,
                transVal: newTransVal
            };
        }
    }
}

State.prototype.addTransitions = function(transVals, state) {
    var base = this;
    transVals.forEach(function(elem, index, array) {
        base.addTransition(elem, state);
    });
}

State.prototype.getTransition = function(transVal) {
    for (var index = 0; index < this.transitions.length; index++) {
        if (this.transitions[index].transVal === transVal) {
            return this.transitions[index];
        }
    }

    return null;
}

State.prototype.transCount = function() {
    return this.transitions.length;
}

Ndfa = function(regex) {
    this.startState = null;
    this.regex = regex;
    if (typeof regex === 'undefined') {
        this.regex = "";
    }
}

Ndfa.prototype.generateStates = function() {
    this.startState = new State();
    var curState = this.startState;

    for (var index = 0; index < this.regex.length; index++) {
        if (this.validate.isValid(this.regex[index])) {
            var newState = new State();
            curState.addTransition(this.regex[index], newState);
            curState = newState;
        } else if (this.regex[index] === '(') {
            var enumLen = this.getEnumLength(this.regex.substring(index));
            var enumeration = this.extract(this.regex, index, enumLen);
            var newState = this.getEnumState(enumeration, curState);
            if (newState !== null) {
                curState = newState;
                index += enumLen;
            }
        } else if (this.regex[index] === '[') {
            var loopLen = this.getLoopLength(this.regex.substring(index));
            var loop = this.extract(this.regex, index, loopLen);
            var newState = this.processLoop(loop, curState);
            if (newState !== null) {
                curState = newState;
                index += loopLen;
            }
        }
    }
    curState.isTerm = true;
}

Ndfa.prototype.extract = function(str, index, extractionLen) {
    return this.regex.substr(index + 1, extractionLen - 1);
}

Ndfa.prototype.getLoopLength = function(str) {
    if (str[0] !== '[') {
        return null;
    }

    var index = 0;
    while (str[index] !== ']') {
        if (str.length === index) {
            return null;
        }
        index += 1;
    }
    return index;
}

Ndfa.prototype.processLoop = function(loop, initialState) {
    var trans = loop.split('|');

    for (var index = 0; index < trans.length; index++) {
        var notValid = (trans[index].length !== 1 || trans[index].length !== 2) && !this.validate.isValid(trans[index])
        if (notValid) {
            return null;
        }
    }

    var state = new State();
    var base = this;

    trans.forEach(function(elem, index, array) {
        if (elem.length === 1) {
            initialState.addTransition(elem, state);
            state.addTransition(elem, state);
        } else {
            var range = base.validate.getRange(elem.charAt(0), elem.charAt(1));
            initialState.addTransitions(range, state)
            state.addTransitions(range, state);
        }
    });

    return state
}

Ndfa.prototype.getEnumLength = function(str) {
    if (str[0] !== '(') {
        return null;
    }

    var index = 0;
    while (str[index] !== ')') {
        if (str.length === index) {
            return null;
        }
        index += 1;
    }

    return index;
}

Ndfa.prototype.getEnumState = function(str, initialState) {
    var trans = str.split('|');
    for (var index = 0; index < trans.length; index++) {
        var notValid = trans[index].length !== 1 || !this.validate.isValid(trans[index])
        if (notValid) {
            return null;
        }
    }

    var state = new State();
    trans.forEach(function(element, index, array) {
        initialState.addTransition(element, state);
    });

    return state;
}

Ndfa.prototype.testString = function(str) {
    var curState = this.startState;
    for (var index = 0; index < str.length; index++) {
        curState = curState.transition(str[index]);
        if (curState === null) {
            break;
        }
    }
    return curState !== null && curState.isTerm;
}

Ndfa.prototype.validate = (function() {
    this.validateRangeableDigit = function(char) {
        var charCast = char.charCodeAt(0);
        var diff = '9'.charCodeAt(0) - charCast;
        return 9 >= diff && diff >= 0;
    };

    this.validateRangeableLowerCase = function(char) {
        var charCast = char.charCodeAt(0);
        var diff = 'z'.charCodeAt(0) - charCast;
        return 25 >= diff && diff >= 0;
    };

    this.validateRangeableUpperCase = function(char) {
        var charCast = char.charCodeAt(0);
        var diff = 'Z'.charCodeAt(0) - charCast;
        return 25 >= diff && diff >= 0;
    };

    this.validateUnRangeable = function(char) {
        return char === '-' || char === '_' ||
            char === '.' || char === '~' ||
            char === '%';
    };

    this.validateOperators = function(char) {
        return char === '[' || char === ']' ||
            char === '(' || char === ')' ||
            char === '|';
    };

    this.validateEnumsLoops = function(regex) {
        var valid = true;
        var regexArray = regex.split('|');
        return valid;
    };

    this.isValid = function(str) {
        var valid = false;
        for(var index = 0; index < str.length; index++) {
            valid = valid || validateRangeableDigit(str[index]);
            valid = valid || validateRangeableUpperCase(str[index]);
            valid = valid || validateRangeableLowerCase(str[index]);
            valid = valid || validateUnRangeable(str[index]);
        }
        return valid;
    };

    return {
        getRange: function(bound1, bound2) {
            var begin = bound1.charCodeAt(0);
            var end = bound2.charCodeAt(0);
            var charRange = [];
            if (begin > end) {
                begin = bound2Int;
                end = bound1Int;
            }

            for (var char = begin; char <= end; char++) {
                charRange.push(String.fromCharCode(char));
            }

            return charRange;
        },
        canRange: function(bound1, bound2) {
            var valid = false;
            for (var index = 0; index < validateRangeable.length; index++) {
                valid = valid || (validateRangeable[index](bound1) && validateRangeable[index](bound2));
            }
            return valid;
        },
        isValidRegex: function(regex) {
            var valid = true;

            for(var index = 0; index < regex.length; index++) {
                var isValidChar = isValid(regex[index]);
                var isOperator = validateOperators(regex[index]);
                valid = isValidChar || isOperator;
                if(!valid) {
                    break;
                }
            }

            if(valid) {
                valid = validateEnumsLoops(regex);
            }

            return valid;
        }
    };
})();

exports.Ndfa = Ndfa;
var n = new Ndfa('abc');
console.log(n.validate.isValidRegex('abc'));
console.log(n.validate.isValidRegex('abcab[=]e'));
console.log(n.validate.isValidRegex('abc[]aed'));
console.log(n.validate.isValidRegex('abc[aeefsd]eee()aaa'));
