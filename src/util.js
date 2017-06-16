import _ from 'lodash';
import ProgressBar from 'progress'

export function getExtention(fileName) {
  return _.last(fileName.split('.'));
}

export function listSongs(library) {
  return _.chain(library)
    .map(artiest => artiest.albums)
    .flatten()
    .map(album => album.songs)
    .flatten()
    .value();
}

export function newProgressBar(total, message) {
  let progressBar = new ProgressBar(`${message} :bar :current/:total`, {
    total,
    width: 100,
    curr: -1,
    incomplete: '░',
    complete: '█',
  });
  progressBar.tick();

  return progressBar;
}
