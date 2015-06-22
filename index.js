State = function (isTerm, transitions) {
    this.isTerm = isTerm;
    this.transitions = [];
    if(typeof transitions !== 'undefined') {
        this.transitions = this.transitions.concat(transitions);
    }
    if(typeof isTerm !== 'undefined') {
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
                index += enumLen;
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
    var stackDepth = 0;
    var index = 0;
    do {
        if(str[index] === '[') {
            stackDepth += 1;
        } else if (str[index] === ']') {
            stackDepth -= 1;
        }
        index += 1;
    } while(stackDepth > 0 && index < str.length);
    if(index === str.length) {
        return null;
    }
    return index;
};

Ndfa.prototype.processLoop = function(loop, curState) { // Not finished.
    var state = new State();
    var trans = loop.split('|');
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
    var substrArray = str.split('|');
    for(var index = 0; index < substrArray.length; index++) {
        if(substrArray[index].length !== 1 || !this.validate.isValid(substrArray[index])) {
            return null;
        }
    }

    var state = new State();

    substrArray.forEach(function(element, index, array) {
        initialState.addTransition(element, state);
    });

    return state;
};

Ndfa.prototype.resolveAmbiguity = function(lastState, firstState) { // Prevent the creation of an NDFA!

};

Ndfa.prototype.testString = function(str) {
    var isValid = false;
    var curState = this.startState;
    for(var index = 0; index < str.length; index++) {
        var newState = curState.transition(str[index]);
        if(newState === null) {
            break;
        } else {
            curState = newState;
        }
    }
    if(curState.isTerm && newState != null) {
        isValid = true;
    }
    return isValid;
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
        isValid: function(char) {
            var validationFuncs = validateRangeable.concat(validateUnRangeable);
            var valid = false;
            for(var index = 0; index < validationFuncs.length; index++) {
                valid = valid || validationFuncs[index](char);
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

var x = new Ndfa('_-(a|b|e|c)c(c|b|e)');
x.generateStates();
console.log(x.testString('_-~ce'));
console.log(x.testString('_-ccb'))
console.log(x.testString('_-cdb'))
console.log(x.testString('_-bcb'));
console.log(x.testString('_-cc'));
console.log(x.validate.getRange('Z', 'A'));
