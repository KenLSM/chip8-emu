// BYTE SIZE = 8
// 0000 0000 = 1-byte

const sleep = i => { for(let i = 0; i < i*100000000; i++) {let c = i; c += c + i}; }
const RomUtils = require('./romUtils');
const DrawUtils = require('./drawUtils');
const KeyUtils = require('./keypressutils');
const getRandomInt = max => {
  return Math.floor(Math.random() * Math.floor(max));
}

const fs = require('fs');

const DEBUG = true;

const fd = fs.openSync('tetris.rom', 'r');



let programCounter = 512; // 0x200
let I = 0; // ??
let V = Array(16).fill(0); // special counter
let VF = 0; // visual flag?
let DT = 0;
let ST = 0;
let keyPressed = [];

KeyUtils.handleKeyPress(keyPressed);
let canvas = DrawUtils.init();
DrawUtils.draw(canvas);
const rawRom = fs.readFileSync(fd);
const romData = RomUtils.fillRomWithSpirtes(
  RomUtils.padRom(
    RomUtils.parseRom(rawRom),
    programCounter
  )
);


RomUtils.printRom(romData, 0);

let programStack = [];

const log = (...args) => DEBUG ? console.log(...args) : null;

const error = (...args) => DEBUG ? console.error(...args) : null;

try {
  while (true) {
    const instH = romData[programCounter];
    const instL = romData[programCounter + 1];
    const inst = instH.concat(instL);

    log('ProgramCounter:', programCounter);
    log('Reading:', inst);
    log('K', inst[0])
    console.log('keypress', keyPressed[0], keyPressed[0] === 'q' )
    if (keyPressed[0] === 'q') { process.exit(); }
    continue;
    switch (inst[0]) {
      case 'a':
        {
          I = parseInt(inst.slice(1), 16);
        }
        programCounter += 2;
        break;
      case 'c':
        {
          const vIdx = parseInt(inst[1], 16);
          const kk = parseInt(inst.slice(2, 4), 16);
          const rand = getRandomInt();
          V[vIdx] = rand & kk;
        }
        programCounter += 2;
        break;
      case 'd':
        { // Drawing command
          // throw new Error();
          const vX = parseInt(inst[1], 16);
          const vY = parseInt(inst[2], 16);
          const n = parseInt(inst[3], 16); // read for n-bytes starting from register I
          for (let i = 0; i < n; i++) {
            // I = I + i;
            const sevenPixelInfo = parseInt(romData[I + i]).toString(2);
            // console.log(sevenPixelInfo);
            for (let ii = 0; ii < 7; ii++) {
              const newPixel = canvas[vX][vY + ii];
              // console.log((newPixel !== sevenPixelInfo[ii]));
              canvas[vX][vY + ii] = (newPixel != sevenPixelInfo[ii]);
            }
          }
          DrawUtils.draw(canvas);
          // console.log(canvas);
        }
        programCounter += 2;
        break;
      case 'e':
        { // key is pressed
          const vIdx = parseInt(inst[1], 16);
          const LL = inst.slice(2, 4);
          switch (LL) {
            case '9e':
              {
                if (V[vIdx] === keyPressed[0]) {
                  programCounter += 2;
                }
              }
              break;
            case 'a1':
              {
                if (V[vIdx] !== keyPressed[0]) {
                  programCounter += 2;
                }
              }
              break;
            default:
              {
                console.error('\n\nUnhandled instruction on e inst', inst, LL);
                throw new Error();
              }
          }

        }
        programCounter += 2;
        break;
      case 'f':
        {
          const LL = inst.slice(2, 4);
          switch (LL) {
            case '1e':
              {
                const vIdx = parseInt(inst[1], 16);
                I += V[vIdx];
                I = I & 0xFF;
              }
              break;
            case '15':
              {
                const vIdx = parseInt(inst[1], 16);
                DT = V[vIdx];
                DT = DT & 0xFF;

              }
              break;
            case '07':
              {
              	const vIdx = parseInt(inst[1], 16);
                V[vIdx] = DT;
              }
              break;
            default:
              {
                console.error('\n\nUnhandled instruction on f inst', inst, LL);
                throw new Error();
              }

          }
        }
        programCounter += 2;
        break;
      case '0':
        {
          if (inst === '00ee') {
            programCounter = programStack.pop();
            programCounter += 2;
            break;
          }
          error('\n\n Unhandled sub-instruction', inst);
        }
        throw new Error();
      case '1':
        {
          programCounter = parseInt(inst.slice(1), 16);
        }
        break;
      case '2':
        {
          programStack.push(programCounter);
          programCounter = parseInt(inst.slice(1), 16);
          log('Move to', parseInt(inst.slice(1), 16));
        }
        break;
      case '3':
        {
          const vIdx = parseInt(inst[1], 16);
          const kk = parseInt(inst.slice(2, 4), 16);
          console.log('\nBE command. V:', vIdx, V, '\nTest if', V[0], '===', kk);
          if (V[vIdx] === kk) {
            programCounter += 2; // skip next
          }
          programCounter += 2;
          debugger;
        }
        break;
      case '4':
        {
          const vIdx = parseInt(inst[1], 16);
          const kk = parseInt(inst.slice(2, 4), 16);
          console.log('\nBNE command. V:', vIdx, V, '\nTest if', V[0], '!==', kk);
          if (V[vIdx] !== kk) {
            programCounter += 2; // skip next
          }
          programCounter += 2;
          debugger;
        }
        break;
      case '6':
        {
          const vIdx = parseInt(inst[1], 16);
          V[vIdx] = parseInt(inst.slice(2, 4), 16);
          log('Set V', vIdx, 'to', parseInt(inst.slice(2, 4), 16));
          programCounter += 2;
        }
        break;
      case '7':
        {
          const vIdx = parseInt(inst[1], 16);
          V[vIdx] += parseInt(inst.slice(2, 4), 16);
          V[vIdx] = V[vIdx] & 0xFF;
          log('Add V', vIdx, 'by', parseInt(inst.slice(2, 4), 16));
          programCounter += 2;
        }
        break;

      default:
        console.error('\n\nUnhandled instruction on first byte array', inst);
        throw new Error();
    }
    DT--;
    ST--;
  }
} catch (e) {
  log('\n\nCrashed', '\nPC', programCounter, '\nI', I, '\nV', ...V, '\n\n');
  throw e;
}