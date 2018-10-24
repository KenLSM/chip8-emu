const readline = require('readline');

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.on('SIGINT', () => {
  process.exit()
});

const handleKeyPress = ref => {
  process.stdin.on('keypress', (str, key) => {
    ref[0] = str;
    if (str === 'q' || key.sequence === '\u0003') {
      ref[1] = true;
      process.exit();
    }
  });
}

module.exports = {
  handleKeyPress,
};