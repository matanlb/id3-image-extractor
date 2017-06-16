import _ from 'lodash';

export function getExtention(fileName) {
  return _.last(fileName.split('.'));
}

export function listSongs(library) {
  return _.chain(library)
    .map(artiest => artiest.albums)
    .flatten()
    .map(album => album.songs)
    .flatten()
    .values();
}
