import FileSystem from 'fs';
import jsmediatags from 'jsmediatags';
import Promise from 'bluebird';
import _ from 'lodash';

export function readId3Tags(path) {
  return new Promise((resolve, reject) =>
    jsmediatags.read(path, {
      onSuccess: resolve,
      onError: reject,
    })
  );
}

export function loadSongMetadata(song) {
  return readId3Tags(song.path)
    .then(metadata => _.assign(song, { metadata }))
    .return(song);
}

export function writeTags(/* path, tags */) {
  // pending
}

export function createFile(path, buffer) {
  return FileSystem.createWriteStream(path)
    .end(Buffer.from(buffer));
}