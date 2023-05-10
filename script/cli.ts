import readline from 'readline'

let spinnerIndex = 0;
const spinnerChars = ['|', '/', '-', '\\'];
let spinner: NodeJS.Timer;


function clearLine() {
  readline.clearLine(process.stdout, 0);
  readline.cursorTo(process.stdout, 0);
}

export function startSpinner(verb = 'Loading') {
  spinnerIndex = 0;
  console.log("");
  spinner = setInterval(() => {
      printSpinner(verb);
  }, 100);
}

export function stopSpinner() {
  clearLine();
  clearInterval(spinner);
}

function printSpinner(verb: string) {
  process.stdout.write(`\r${spinnerChars[spinnerIndex]} Loading...`);
  spinnerIndex = (spinnerIndex + 1) % spinnerChars.length;
}



let progress: NodeJS.Timer;
let speed: NodeJS.Timer;
let avgSpeed = 0;
let relSpeed: number[] = [];

let progressTarget = 0;
let progressDone = 0;
let lastProgressDone = 0;

let progressStatus = '';

export function startProgress(target: number, verb = 'Loading') {
  progressTarget = target;
  progressDone = 0;
  spinnerIndex = 0;
  progress = setInterval(() => {
      printProgress(verb);
  }, 100);
  relSpeed = [0,0,0,0];
  speed = setInterval(() => {
      calcSpeed();
  }, 250);
}

export function updateProgress(nextProgressDone: number, status?: string) {
  progressDone = nextProgressDone;
  progressStatus = status ?? '';
}

export function stopProgress() {
  clearInterval(progress);
}

function printProgress(verb: string) {
  let percentageDone = progressDone / progressTarget;
  process.stdout.write(`\r${spinnerChars[spinnerIndex]} ${verb} ${progressBar(percentageDone)} ${Math.round(percentageDone * 100)}% (${avgSpeed}/s ${progressStatus ? ` - ${progressStatus}` : ''})`);
  spinnerIndex = (spinnerIndex + 1) % spinnerChars.length;
}

function calcSpeed() {
  let currentSpeed = progressDone - lastProgressDone;
  lastProgressDone = progressDone;
  relSpeed.unshift(currentSpeed);
  relSpeed.pop();
  avgSpeed = relSpeed.reduce((a, b) => a + b, 0) / relSpeed.length;
}

function progressBar(progress: number, barLength: number = 30) {
  const filledLength = Math.round(progress * barLength);
  const filled = '█'.repeat(filledLength);
  const empty = '░'.repeat(barLength - filledLength);
  return `[${filled}${empty}]`;
}
