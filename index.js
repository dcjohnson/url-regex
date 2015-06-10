State = function (isTerm, transitions) {
	this.isTerm = isTerm;
	this.transitions = [];
	if(typeof transitions !== 'undefined') {
		this.transitions = this.transitions.concat(transitions);
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
	this.transitions.push({
		state : state,
		transVal : transVal
	});
};

State.prototype.transCount = function() {
	return this.transitions.length;
};

Ndfa = function (regex) {
	this.startState = null;
	this.regex = regex;
};

Ndfa.prototype.generateStates = function() {
	this.startState = new State(false);

	var curState = this.startState;

	for (var index = 0; index < this.regex.length; index++) {
		if(this.validate.isValid(this.regex[index])) {
			var newState = new State(false);
			curState.addTransition(this.regex[index], newState);
			curState = newState;
		} else if(this.regex[index] === '[') {
			var loopLen = this.getLoopLength(this.regex.substr(index));
			var loop = this.regex.substr(index, loopLen);
		}
	}
	curState.isTerm = true;
};

Ndfa.prototype.getLoopLength = function(str) {
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
};

Ndfa.prototype.processLoop = function(loop) {

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
	this.validationFuncs = [
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
		},
		function(char) {
			return char === '-' || char === '_'
				char === '.' || char === '~';
		}
	];
	return {
		isValid: function(char) {
			var valid = false;
			for(var index = 0; index < validationFuncs.length; index++) {
				valid = valid || validationFuncs[index](char);
			}
			return valid;
		}
	};
})();

exports.Ndfa = Ndfa;

var x = new Ndfa('abc');
x.generateStates();
console.log(x.testString('abcc'));
