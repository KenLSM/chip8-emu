const defaultState = {
  /* Emulator states */
  programCounter: 0x200, // PC begins at 0x200
  I: 0, // ??
  V: Array(16).fill(0), // 16 V-Registers
  DT: 0, // Delay Timer, counts down to 0
  ST: 0, // Sound Timer, counts down to 0
  // programStack: [],
};

const states = [];
const initState = () => {
  const r = Object.assign({}, defaultState);
  r.V = new Array(16).fill(0);
  return r;
};

const pushState = state => {
  // states.push(state);
  states.push(state.programCounter);
  state.programCounter = 0;
  return state;
  // return initState();
};

const popState = state => {
  state.programCounter = states.pop();
  return state;
}

module.exports = {
  initState,
  popState,
  pushState,
};