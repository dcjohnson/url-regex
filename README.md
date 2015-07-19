# url-regex
A small node.js regex library for a url router.

#example

```js
var regex = require('tiny-url-regex');
var ndfa = regex.Ndfa('abc[ae](1|3)w'); // Any valid regex rule.
ndfa.generateStates();
var isValid = ndfa.testString('abcaeaeaeeea3w'); // valid
var isValid2 = ndfa.testString('abc'); //invalid
```

I pity anyone who uses this for production.  

Feel free to improve it!
