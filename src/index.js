// BYTE SIZE = 8
// 0000 0000 = 1-byte
const CONSTANTS = require('./constants');
const fs = require('fs');
const RomUtils = require('./romUtils');
const DrawUtils = require('./drawUtils');
const KeyUtils = require('./keypressUtils');
const SystemUtils = require('./systemUtils');

const getRandomInt = max => Math.floor(Math.random() * Math.floor(max));


const fd = fs.openSync('spaceinv.rom', 'r');

SystemUtils.initState();

// Emulator state
let state = SystemUtils.initState();

// [KeyPressed, ShouldContinueRunning]
const keyPressed = [null, true];

/* Emulator inits */
KeyUtils.handleKeyPress(keyPressed);
let canvas = DrawUtils.init();
DrawUtils.draw(canvas);
const rawRom = fs.readFileSync(fd);
const romData = RomUtils.fillRomWithSpirtes(
  RomUtils.padRom(
    RomUtils.parseRom(rawRom),
    state.programCounter,
  ),
);

/* Emulator rom health check */
RomUtils.printRom(romData, 0);

const log = (...args) => (CONSTANTS.DEBUG ? console.log(...args) : null);
const error = (...args) => (console.error(...args));

const loop = async () => {
  const instH = romData[state.programCounter];
  const instL = romData[state.programCounter + 1];
  const inst = instH.concat(instL);

  log('\nInstruction:', inst);

  switch (inst[0]) {
    case 'a':
      state.I = parseInt(inst.slice(1), 16);
      state.programCounter += 2;
      log('SET: I', parseInt(inst.slice(1), 16));
      break;
    case 'c':
      {
        const vIdx = parseInt(inst[1], 16);
        const kk = parseInt(inst.slice(2, 4), 16);
        const rand = getRandomInt(255);
        log('RAND', rand);
        state.V[vIdx] = rand & kk;
      }
      state.programCounter += 2;
      break;
    case 'd':
      { // Drawing command
        const vX = state.V[parseInt(inst[1], 16)];
        const vY = state.V[parseInt(inst[2], 16)];
        state.V[0xF] = 0; // Reset VF to 0
        const n = parseInt(inst[3], 16); // read for n-bytes starting from register I
        for (let i = 0; i < n; i++) {
          const eightPixelInfo = parseInt(romData[state.I + i], 16).toString(2).padStart(8, 0);
          for (let ii = 0; ii < 8; ii++) {
            const y = (vY + i) & 0x1F;
            const x = (vX + ii) & 0x3F;
            const newPixel = canvas[y][x];
            const incPix = parseInt(eightPixelInfo[ii], 2);
            if (canvas[y][x] && incPix) {
              error(canvas[y][x], incPix, eightPixelInfo[ii]);
              state.V[0xF] = 1;
            }
            canvas[y][x] = (newPixel != incPix);
          }
          log('8 Pixel', eightPixelInfo, parseInt(romData[state.I + i], 16), romData[state.I + i]);
        }
        DrawUtils.draw(canvas);
        log('DRAW DATA: (Vx, Vy, n)', vX, vY, n);
        // await stepper();
      }
      state.programCounter += 2;
      break;
    case 'e':
      { // key is pressed
        const vIdx = parseInt(inst[1], 16);
        const LL = inst.slice(2, 4);
        switch (LL) {
          case '9e':
            if (state.V[vIdx] === keyPressed[0]) {
              state.programCounter += 2;
            }
            log('Keypress check', state.V[vIdx], '===', keyPressed[0]);
            break;
          case 'a1':
            if (state.V[vIdx] !== keyPressed[0]) {
              state.programCounter += 2;
            }
            log('Keypress check', state.V[vIdx], '!==', keyPressed[0]);
            break;
          default:
            error('\n\nUnhandled instruction on e inst', inst, LL);
            throw new Error();
        }
      }
      state.programCounter += 2;
      break;
    case 'f':
      {
        const LL = inst.slice(2, 4);
        switch (LL) {
          case '07':
            {
              const vIdx = parseInt(inst[1], 16);
              state.V[vIdx] = state.DT & 0xFF;
              log('SET: V[vIdx] = DT', state.V[vIdx], vIdx, state.DT);
            }
            break;
          case '1e':
            {
              const vIdx = parseInt(inst[1], 16);
              state.I = (state.I + state.V[vIdx]) & 0xFFF;
              log('Accum: I += V[vIdx]', state.I, state.V[vIdx], vIdx);
            }
            break;
          case '15':
            {
              const vIdx = parseInt(inst[1], 16);
              state.DT = state.V[vIdx] & 0xFF;
              log('SET: DT = V[vIdx]', state.V[vIdx], vIdx);
            }
            break;
          case '29':
            {
              const vIdx = parseInt(inst[1], 16);
              state.I = state.V[vIdx] * 5;
              log('SET hex font begin loc to I: ', vIdx);
            }
            break;
          case '33':
            {
              const vIdx = parseInt(inst[1], 16);
              const BCD = state.V[vIdx];
              const D = BCD % 10;
              const C = BCD % 100 / 10 | 0; // eslint-disable-line
              const B = BCD % 1000 / 100 | 0; // eslint-disable-line
              romData[state.I] = B;
              romData[state.I + 1] = C;
              romData[state.I + 2] = D;
            }
            break;

          case '55': // MEM DUMP
            {
              const vEnd = parseInt(inst[1], 16);
              for (let i = 0; i < vEnd; i++) {
                romData[state.I + i] = state.V[i];
              }
              log('MEM DUMP TO: I', state.V, romData.slice(state.I, vEnd));
            }
            break;
          case '65': // MEM LOAD
            {
              const vEnd = parseInt(inst[1], 16);
              for (let i = 0; i < vEnd; i++) {
                state.V[i] = romData[state.I + i];
              }
              log('MEM LOAD from: I', state.V, romData.slice(state.I, vEnd));
            }
            break;
          default:
            error('\n\nUnhandled instruction on f inst', inst, LL);
            throw new Error();
        }
      }
      state.programCounter += 2;
      break;
    case '0':

      switch (inst) { // RETURN
        case '00ee':
          state = SystemUtils.popState(state);
          log('RETN FUNC');
          break;
        case '00e0': // CLS
          canvas = DrawUtils.init();
          log('CLS');
          break;
        default:
          error('\n\nUnhandled instruction on for 0', inst);
          throw new Error();
      }
      state.programCounter += 2;
      break;
    case '1': // JUMP
      state.programCounter = parseInt(inst.slice(1), 16);
      log('JUMP', state.programCounter);
      break;
    case '2': // CALL
      state = SystemUtils.pushState(state);
      state.programCounter = parseInt(inst.slice(1), 16);
      log('CALL FUNC', parseInt(inst.slice(1), 16));
      break;
    case '3':
      {
        const vIdx = parseInt(inst[1], 16);
        const kk = parseInt(inst.slice(2, 4), 16);
        log('SE command. V:', vIdx, state.V, '\nTest if', state.V[vIdx], '===', kk);
        if (state.V[vIdx] === kk) {
          log('SE SHOULD SKIP');
          state.programCounter += 2; // skip next
        }
        state.programCounter += 2;
      }
      break;
    case '4':
      {
        const vIdx = parseInt(inst[1], 16);
        const kk = parseInt(inst.slice(2, 4), 16);
        log('SNE command. V:', vIdx, state.V, '\nTest if', state.V[vIdx], '!==', kk);
        if (state.V[vIdx] !== kk) {
          log('SNE SHOULD SKIP');
          state.programCounter += 2; // skip next
        }
        state.programCounter += 2;
      }
      break;
    case '6':
      {
        const vIdx = parseInt(inst[1], 16);
        const kk = parseInt(inst.slice(2, 4), 16);
        state.V[vIdx] = kk;
        log('Set V', vIdx, 'to', kk);
        log('V:', state.V);
        state.programCounter += 2;
      }
      break;
    case '7':
      {
        const vIdx = parseInt(inst[1], 16);
        const kk = parseInt(inst.slice(2, 4), 16);
        state.V[vIdx] = (state.V[vIdx] + kk) & 0xFF;
        log('ADD V', vIdx, 'by', kk, state.V[vIdx]);
        log('V:', state.V);
        state.programCounter += 2;
      }
      break;
    case '8':
      {
        const L = inst[3];
        switch (L) {
          case '0':
            {
              const Vx = parseInt(inst[1], 16);
              const Vy = parseInt(inst[2], 16);
              state.V[Vx] = state.V[Vy];
              log('SET Vx = Vy', Vx, Vy, state.V[parseInt(inst[1], 16)], 'to ', state.V[parseInt(inst[2], 16)]);
            }
            break;
          case '2': // bitwise compare Vx = Vx & Vy
            {
              const Vx = parseInt(inst[1], 16);
              const Vy = parseInt(inst[2], 16);
              state.V[Vx] &= state.V[Vy];
              log('V:', state.V);
              log('SET Vx = Vx & Vy', Vx, Vy, state.V[Vx], state.V[Vy]);
            }
            break;
          default:
            error('\n\nUnhandled instruction on 8 inst', inst, L);
            throw new Error();
        }
      }
      state.programCounter += 2;
      break;

    default:
      error('\n\nUnhandled instruction on first byte array', inst);
      throw new Error();
  }
  state.DT -= state.DT > 0 ? 1 : 0;
  state.ST -= state.ST > 0 ? 1 : 0;
};

let delay = 1;

const stepper = async () => {
  while (!keyPressed[0]) {
    await new Promise(p => setTimeout(p, 100));
  }
  keyPressed[0] = null;
  log('State', state);
};

const main = async () => {
  while (keyPressed[1]) {
    const start = new Date().getTime();
    await new Promise(p => setTimeout(p, delay)); // eslint-disable-line
    await loop();
    // await stepper();
    // log((new Date().getTime() - start));
    delay = 16 - (new Date().getTime() - start); // 60 fps
  }
  log('\n\nHalted:', state);
};
main()
  .catch(e => {
    error('### Crashed ##');
    error('\n\nSTATE DUMP', '\nPC', state.programCounter, '\nI', state.I, '\nV', ...state.V, '\n\n');
    error(e);
  })
  .finally(() => {
    console.log('Ended');
    process.exit();
  });