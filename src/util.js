import _ from 'lodash';
import ProgressBar from 'progress';

export const KNOWN_EXTENSION = ['mp3', 'm4a'];

export function getExtension(fileName) {
  return _.last(fileName.split('.'));
}

export function newProgressBar(total, message, init = false) {
  message += _.repeat(' ', 25 - message.length);
  const progressBar = new ProgressBar(`${message} :bar :current/:total`, {
    total,
    width: process.stdout.columns - 50,
    curr: -1,
    incomplete: '░',
    complete: '█',
    renderThrottle: 0,
  });
  if (init) progressBar.tick();

  return progressBar;
}
