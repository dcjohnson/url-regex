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
	var validator = new ValidateRegex(true);

	for (var index = 0; index < this.regex.length; index++) {
		if(validator.isValid(this.regex[index])) {
			var newState = new State(false);
			curState.addTransition(this.regex[index], newState);
			curState = newState;
		}
	}
	curState.isTerm = true;
};

Ndfa.prototype.getLoopLength = function(str) {

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

ValidateRegex = function(shouldDefault) {
	this.validationFuncs = [];
	if(shouldDefault) {
		this.setupDefaults();
	}
};

ValidateRegex.prototype.setupDefaults = function() {
	this.validationFuncs.push(function(char) {
		var charCast = char.charCodeAt(0);
		var diff = '9'.charCodeAt(0) - charCast;
		return 9 >= diff && diff >= 0;
	});
	this.validationFuncs.push(function(char) {
		var charCast = char.charCodeAt(0);
		var diff = 'z'.charCodeAt(0) - charCast;
		return 25 >= diff && diff >= 0;
	});
	this.validationFuncs.push(function(char) {
		var charCast = char.charCodeAt(0);
		var diff = 'Z'.charCodeAt(0) - charCast;
		return 25 >= diff && diff >= 0;
	});
	this.validationFuncs.push(function(char) {
		return char === '-' || char === '_'
			char === '.' || char === '~';
	});
};

ValidateRegex.prototype.isValid = function(char) {
	var valid = false;
	for(var index = 0; index < this.validationFuncs.length; index++) {
		valid = valid || this.validationFuncs[index](char);
	}
	return valid;
}

exports.Ndfa = Ndfa;

var x = new Ndfa('abc');
x.generateStates();
console.log(x.testString('abcza'));
