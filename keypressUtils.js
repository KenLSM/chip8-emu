const readline = require('readline');

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

const handleKeyPress = ref => {
	process.stdin.on('keypress', (str, key) => {
		ref[0] = str;
		if (str === 'q') process.exit();
	});	
}

module.exports = {
	handleKeyPress,
};

const k = [];
handleKeyPress(k);

while(true) console.log(k[0]);